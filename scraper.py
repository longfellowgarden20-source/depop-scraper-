import requests
import time
from datetime import datetime, timezone
from config import SEARCH_QUERIES, MIN_PRICE, MAX_PRICE, POLL_INTERVAL, SUPABASE_URL, SUPABASE_SERVICE_KEY

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    "Accept": "application/json",
}

SUPA_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

SCORE_SIGNALS = [
    "deadstock", "ds", "unworn", "nwt", "new with tags",
    "made in usa", "made in japan", "made in italy",
    "80s", "90s", "1980s", "1990s", "2000s", "y2k",
    "rare", "vintage", "og", "original",
    "single stitch", "thrashed", "distressed", "faded",
    "spell out", "big logo", "block letter",
]


def supa_get(table, filters=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    resp = requests.get(url, headers=SUPA_HEADERS, timeout=10)
    return resp.json() if resp.ok else []


def supa_upsert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {**SUPA_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"}
    resp = requests.post(url, headers=headers, json=data, timeout=10)
    return resp.ok


def supa_update(table, data, match_col, match_val):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_col}=eq.{match_val}"
    headers = {**SUPA_HEADERS, "Prefer": "return=minimal"}
    resp = requests.patch(url, headers=headers, json=data, timeout=10)
    return resp.ok


def supa_insert(table, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {**SUPA_HEADERS, "Prefer": "return=minimal"}
    resp = requests.post(url, headers=headers, json=data, timeout=10)
    return resp.ok


def keyword_score(title, description):
    text = f"{title} {description}".lower()
    hits = sum(1 for signal in SCORE_SIGNALS if signal in text)
    return min(hits * 2, 10)


def search_depop(query, offset=0):
    url = "https://api.depop.com/api/v2/search/products/"
    params = {
        "q": query,
        "offset": offset,
        "limit": 48,
        "country": "us",
        "currency": "USD",
        "sort": "newlyListed",
    }
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[scraper] Error fetching '{query}': {e}")
        return None


def extract_listings(data):
    results = []
    for item in data.get("objects", []):
        p = item.get("product", item)
        price_val = p.get("priceAmount") or p.get("price", {}).get("priceAmount", 0)
        results.append({
            "id": str(p.get("id") or p.get("slug", "")),
            "title": p.get("description", "")[:120],
            "price": float(price_val or 0),
            "description": p.get("description", ""),
            "seller": p.get("seller", {}).get("username", ""),
            "image_url": (p.get("pictures") or [{}])[0].get("url", ""),
            "listing_url": f"https://www.depop.com/products/{p.get('slug', '')}",
            "sold": 1 if p.get("sold") else 0,
        })
    return results


def save_listing(listing, query):
    score = keyword_score(listing["title"], listing["description"])
    now = datetime.now(timezone.utc).isoformat()

    existing = supa_get("depop_listings", f"id=eq.{listing['id']}&select=id,sold,price")
    existing = existing[0] if existing else None

    if existing is None:
        supa_upsert("depop_listings", {
            "id": listing["id"],
            "query": query,
            "title": listing["title"],
            "price": listing["price"],
            "description": listing["description"],
            "seller": listing["seller"],
            "image_url": listing["image_url"],
            "listing_url": listing["listing_url"],
            "sold": listing["sold"],
            "score": score,
            "first_seen": now,
        })
        supa_insert("depop_price_history", {
            "listing_id": listing["id"],
            "price": listing["price"],
            "recorded_at": now,
        })
        upsert_seller(listing["seller"], now)
        return "new"

    elif existing["sold"] == 0 and listing["sold"] == 1:
        supa_update("depop_listings", {"sold": 1, "sold_at": now}, "id", listing["id"])
        return "sold"

    elif existing["price"] != listing["price"]:
        supa_update("depop_listings", {"price": listing["price"]}, "id", listing["id"])
        supa_insert("depop_price_history", {
            "listing_id": listing["id"],
            "price": listing["price"],
            "recorded_at": now,
        })
        return "price_changed"

    return "seen"


def upsert_seller(username, now):
    if not username:
        return
    supa_upsert("depop_sellers", {"username": username, "last_seen": now})


def bump_seller_match(username):
    existing = supa_get("depop_sellers", f"username=eq.{username}&select=match_count")
    if existing:
        count = (existing[0].get("match_count") or 0) + 1
        supa_update("depop_sellers", {"match_count": count}, "username", username)


def in_price_range(price):
    if MIN_PRICE is not None and price < MIN_PRICE:
        return False
    if MAX_PRICE is not None and price > MAX_PRICE:
        return False
    return True


def run_once():
    new_listings = []

    for query in SEARCH_QUERIES:
        print(f"[scraper] Checking: {query}")
        data = search_depop(query)
        if not data:
            continue

        listings = extract_listings(data)
        for listing in listings:
            if not in_price_range(listing["price"]):
                continue
            status = save_listing(listing, query)
            if status == "new":
                new_listings.append((query, listing))
                score = keyword_score(listing["title"], listing["description"])
                print(f"  + NEW [score:{score}]: {listing['title'][:55]} — ${listing['price']}")
            elif status == "sold":
                print(f"  SOLD: {listing['title'][:60]}")
            elif status == "price_changed":
                print(f"  PRICE DROP: {listing['title'][:50]} now ${listing['price']}")

        time.sleep(1)

    return new_listings


if __name__ == "__main__":
    print("[scraper] Starting Depop scraper (Supabase)...")
    while True:
        new = run_once()
        print(f"[scraper] Done. {len(new)} new listings. Sleeping {POLL_INTERVAL}s...\n")
        time.sleep(POLL_INTERVAL)
