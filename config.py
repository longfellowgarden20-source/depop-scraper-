# Search queries — add as many as you want
SEARCH_QUERIES = [
    "billabong hoodie vintage",
    "nike acg 90s",
    "carhartt detroit jacket",
]

# Only notify if price is within this range (set None to disable)
MIN_PRICE = 0
MAX_PRICE = 150

# How often to check for new listings (seconds)
POLL_INTERVAL = 120

# Gemini API key — get free at aistudio.google.com
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"

# Groq API key — get free at console.groq.com (used to explain WHY a listing matched)
GROQ_API_KEY = "YOUR_GROQ_API_KEY"

# Supabase — same project as agency scraper
SUPABASE_URL = "https://aszrhjxnyecfdvndcvi.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenJoanhueHllY2Zkdm5kY3ZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc1MDY5MiwiZXhwIjoyMDk1MzI2NjkyfQ.967bKoHOv_UjeB0nF4wp7jdIiw-CGD2XJRajbtZYKEI"

# Describe exactly what you're looking for — be specific
ITEM_DESCRIPTIONS = {
    "billabong hoodie vintage": "A 1990s Billabong hoodie. Look for: boxy fit, embroidered or screen-printed logo on chest, vintage colorways like navy/red/green. NOT modern slim fit Billabong.",
    "nike acg 90s": "A 1990s Nike ACG jacket or fleece. Look for: ACG logo, earth tones, technical outdoor styling from the 90s era.",
    "carhartt detroit jacket": "A Carhartt Detroit jacket, preferably made in USA. Look for: blanket-lined, snap buttons, Carhartt logo patch, worn/faded look.",
}
