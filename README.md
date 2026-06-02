# Depop Scraper

Monitors Depop for specific vintage items using keyword search + Gemini vision AI to filter by photo.

## Setup

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Get a free Gemini API key at https://aistudio.google.com

3. Edit `config.py`:
   - Add your Gemini API key
   - Set your search queries
   - Set your price range
   - Write descriptions of exactly what you're looking for

## How to run

**Step 1 — scrape new listings:**
```
python scraper.py
```
Runs continuously, checks every 2 minutes, saves everything to `data/listings.db`

**Step 2 — run vision check on new listings:**
```
python vision.py
```
Sends unscreened listing photos to Gemini, marks matches

**Step 3 — view your matches:**
```
python view.py
```

## Files
- `config.py` — your search queries, price range, item descriptions
- `scraper.py` — polls Depop API, saves listings to SQLite
- `vision.py` — sends photos to Gemini Flash, marks AI matches
- `view.py` — prints matched listings to terminal
- `data/listings.db` — SQLite database (auto-created)
