import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/depop_listings?ai_match=eq.1&select=id,title,price,seller,listing_url,image_url,first_seen,sold,sold_at,score,ai_reason,query&order=score.desc,first_seen.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const listings = await res.json()

    const sellersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/depop_sellers?select=username,match_count`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const sellers = await sellersRes.json()
    const sellerMap: Record<string, number> = {}
    for (const s of sellers) sellerMap[s.username] = s.match_count

    const result = listings.map((l: Record<string, unknown>) => ({
      ...l,
      seller_matches: sellerMap[l.seller as string] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
