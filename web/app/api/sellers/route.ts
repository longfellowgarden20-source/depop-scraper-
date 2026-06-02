import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/depop_sellers?select=username,match_count,last_seen&order=match_count.desc&limit=50`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const sellers = await res.json()

    const listingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/depop_listings?select=seller,price,sold`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const listings = await listingsRes.json()

    const statsMap: Record<string, { total: number; sold: number; prices: number[] }> = {}
    for (const l of listings) {
      if (!statsMap[l.seller]) statsMap[l.seller] = { total: 0, sold: 0, prices: [] }
      statsMap[l.seller].total++
      if (l.sold) statsMap[l.seller].sold++
      if (l.price) statsMap[l.seller].prices.push(l.price)
    }

    const result = sellers.map((s: { username: string; match_count: number; last_seen: string }) => {
      const stats = statsMap[s.username] ?? { total: 0, sold: 0, prices: [] }
      const avg = stats.prices.length ? stats.prices.reduce((a: number, b: number) => a + b, 0) / stats.prices.length : 0
      return {
        ...s,
        total_listings: stats.total,
        sold_count: stats.sold,
        avg_price: avg,
      }
    })

    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
