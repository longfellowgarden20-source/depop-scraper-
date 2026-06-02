import sqlite3
from scraper import DB_PATH


def show_matches():
    conn = sqlite3.connect(DB_PATH)

    rows = conn.execute("""
        SELECT l.title, l.price, l.seller, l.listing_url, l.first_seen, l.sold, l.score, l.ai_reason,
               s.match_count
        FROM listings l
        LEFT JOIN sellers s ON l.seller = s.username
        WHERE l.ai_match = 1
        ORDER BY l.score DESC, l.first_seen DESC
    """).fetchall()

    if not rows:
        print("No AI-matched listings yet. Run scraper.py then vision.py first.")
        conn.close()
        return

    print(f"\n{'='*72}")
    print(f"  AI-MATCHED LISTINGS ({len(rows)} found)")
    print(f"{'='*72}")

    for title, price, seller, url, seen, sold, score, reason, match_count in rows:
        status = "SOLD" if sold else "AVAILABLE"
        seller_flag = f" [seller has {match_count} match(es)]" if match_count and match_count > 1 else ""
        print(f"\n  [{status}] ${price:.0f}  score:{score}/10  — {title[:50]}")
        print(f"  Seller: @{seller}{seller_flag}")
        if reason:
            print(f"  Why: {reason}")
        print(f"  {url}")
        print(f"  Seen: {seen[:16]}")

    print(f"\n{'='*72}\n")


def show_price_history(listing_id):
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("""
        SELECT price, recorded_at FROM price_history
        WHERE listing_id = ?
        ORDER BY recorded_at ASC
    """, (listing_id,)).fetchall()
    conn.close()

    if not rows:
        print(f"No price history for {listing_id}")
        return

    print(f"\nPrice history for {listing_id}:")
    for price, recorded_at in rows:
        print(f"  ${price:.0f}  —  {recorded_at[:16]}")


def show_hot_sellers():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("""
        SELECT username, match_count, last_seen FROM sellers
        WHERE match_count > 0
        ORDER BY match_count DESC
        LIMIT 10
    """).fetchall()
    conn.close()

    if not rows:
        print("No repeat sellers found yet.")
        return

    print(f"\n{'='*50}")
    print("  TOP SELLERS (most matched items)")
    print(f"{'='*50}")
    for username, count, last_seen in rows:
        print(f"  @{username}  —  {count} match(es)  —  last seen {last_seen[:10]}")
        print(f"  https://www.depop.com/{username}/")
    print()


if __name__ == "__main__":
    show_matches()
    show_hot_sellers()
