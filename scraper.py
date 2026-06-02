import requests
import time
import os
import sqlite3
from datetime import datetime
from config import SEARCH_QUERIES, MIN_PRICE, MAX_PRICE, POLL_INTERVAL

HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    "Accept": "application/json",
}

DB_PATH = "data/listings.db"

# Keywords that signal a high-value vintage listing — more hits = higher score
SCORE_SIGNALS = [
    "deadstock", "ds", "unworn", "nwt", "new with tags",
    "made in usa", "made in japan", "made in italy",
    "80s", "90s", "1980s", "1990s", "2000s", "y2k",
    "rare", "vintage", "og", "original",
    "single stitch", "thrashed", "distressed", "faded",
    "spell out", "big logo", "block letter",
]


def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY,
            query TEXT,
            title TEXT,
            price REAL,
            description TEXT,
            seller TEXT,
            image_url TEXT,
            listing_url TEXT,
            sold INTEGER DEFAULT 0,
            ai_match INTEGER DEFAULT 0,
            ai_reason TEXT,
            score INTEGER DEFAULT 0,
            first_seen TEXT,
            sold_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id TEXT,
            price REAL,
            recorded_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sellers (
            username TEXT PRIMARY KEY,
            match_count INTEGER DEFAULT 0,
            last_seen TEXT
        )
    """)
    conn.commit()
    conn.close()


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


def save_listing(conn, listing, query):
    score = keyword_score(listing["title"], listing["description"])
    existing = conn.execute(
        "SELECT sold, sold_at, price FROM listings WHERE id = ?", (listing["id"],)
    ).fetchone()

    now = datetime.utcnow().isoformat()

    if existing is None:
        conn.execute("""
            INSERT INTO listings (id, query, title, price, description, seller, image_url, listing_url, sold, score, first_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            listing["id"], query, listing["title"], listing["price"],
            listing["description"], listing["seller"], listing["image_url"],
            listing["listing_url"], listing["sold"], score, now
        ))
        conn.execute(
            "INSERT INTO price_history (listing_id, price, recorded_at) VALUES (?, ?, ?)",
            (listing["id"], listing["price"], now)
        )
        upsert_seller(conn, listing["seller"], now)
        return "new"

    elif existing[0] == 0 and listing["sold"] == 1:
        conn.execute(
            "UPDATE listings SET sold = 1, sold_at = ? WHERE id = ?",
            (now, listing["id"])
        )
        return "sold"

    elif existing[2] != listing["price"]:
        conn.execute(
            "UPDATE listings SET price = ? WHERE id = ?",
            (listing["price"], listing["id"])
        )
        conn.execute(
            "INSERT INTO price_history (listing_id, price, recorded_at) VALUES (?, ?, ?)",
            (listing["id"], listing["price"], now)
        )
        return "price_changed"

    return "seen"


def upsert_seller(conn, username, now):
    if not username:
        return
    existing = conn.execute("SELECT match_count FROM sellers WHERE username = ?", (username,)).fetchone()
    if existing:
        conn.execute(
            "UPDATE sellers SET last_seen = ? WHERE username = ?",
            (now, username)
        )
    else:
        conn.execute(
            "INSERT INTO sellers (username, match_count, last_seen) VALUES (?, 0, ?)",
            (username, now)
        )


def bump_seller_match(conn, username):
    conn.execute(
        "UPDATE sellers SET match_count = match_count + 1 WHERE username = ?",
        (username,)
    )


def in_price_range(price):
    if MIN_PRICE is not None and price < MIN_PRICE:
        return False
    if MAX_PRICE is not None and price > MAX_PRICE:
        return False
    return True


def run_once():
    conn = sqlite3.connect(DB_PATH)
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
            status = save_listing(conn, listing, query)
            if status == "new":
                new_listings.append((query, listing))
                score = keyword_score(listing["title"], listing["description"])
                print(f"  + NEW [score:{score}]: {listing['title'][:55]} — ${listing['price']}")
            elif status == "sold":
                print(f"  SOLD: {listing['title'][:60]}")
            elif status == "price_changed":
                print(f"  PRICE DROP: {listing['title'][:50]} now ${listing['price']}")

        time.sleep(1)

    conn.commit()
    conn.close()
    return new_listings


if __name__ == "__main__":
    init_db()
    print("[scraper] Starting Depop scraper...")
    while True:
        new = run_once()
        print(f"[scraper] Done. {len(new)} new listings. Sleeping {POLL_INTERVAL}s...\n")
        time.sleep(POLL_INTERVAL)
