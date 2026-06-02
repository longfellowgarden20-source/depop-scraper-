import google.generativeai as genai
import requests
from config import GEMINI_API_KEY, ITEM_DESCRIPTIONS, GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
from scraper import supa_get, supa_update, supa_insert, bump_seller_match

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def download_image(url):
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return resp.content
    except Exception as e:
        print(f"[vision] Failed to download image: {e}")
        return None


def check_listing(image_url, query):
    description = ITEM_DESCRIPTIONS.get(query, "A vintage or rare clothing item matching the search query.")
    image_bytes = download_image(image_url)
    if not image_bytes:
        return False

    prompt = f"""Look at this Depop listing photo and answer YES or NO only.

I am looking for: {description}

Does this item match what I described? Answer YES if it's a strong match, NO if it doesn't match or you can't tell.

Answer with only YES or NO."""

    try:
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes}
        ])
        answer = response.text.strip().upper()
        return answer.startswith("YES")
    except Exception as e:
        print(f"[vision] Gemini error: {e}")
        return False


def generate_reason(title, description, query):
    if not GROQ_API_KEY:
        return ""

    item_desc = ITEM_DESCRIPTIONS.get(query, "a vintage clothing item")
    prompt = f"""A Depop listing matched a search for: {item_desc}

Listing title: {title}
Listing description: {description[:300]}

Write ONE short sentence (under 20 words) explaining the specific visual or descriptive details that make this a strong match. Be specific — mention the actual details like colorway, logo placement, era, or condition clues. No fluff."""

    try:
        res = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.1-8b-instant",
                "max_tokens": 60,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=10,
        )
        data = res.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        print(f"[vision] Groq reason error: {e}")
        return ""


def run_vision_check():
    unscreened = supa_get(
        "depop_listings",
        "ai_match=eq.0&sold=eq.0&image_url=neq.&select=id,image_url,query,title,description,seller&limit=50"
    )

    matches = []
    for row in unscreened:
        listing_id = row["id"]
        print(f"[vision] Checking {listing_id}...")
        is_match = check_listing(row["image_url"], row["query"])

        if is_match:
            reason = generate_reason(row["title"], row["description"], row["query"])
            supa_update("depop_listings", {"ai_match": 1, "ai_reason": reason}, "id", listing_id)
            bump_seller_match(row["seller"])
            matches.append((listing_id, reason))
            print(f"  MATCH: {row['title'][:50]}")
            if reason:
                print(f"  Why: {reason}")
        else:
            supa_update("depop_listings", {"ai_match": -1}, "id", listing_id)

    return matches


if __name__ == "__main__":
    matches = run_vision_check()
    print(f"\n[vision] Found {len(matches)} AI matches.")
