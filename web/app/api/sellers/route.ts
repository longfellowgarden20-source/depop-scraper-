import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: sellers, error } = await supabase
      .from('depop_sellers')
      .select('username,match_count,last_seen')
      .order('match_count', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: listings } = await supabase
      .from('depop_listings')
      .select('seller,price,sold')

    const statsMap: Record<string, { total: number; sold: number; prices: number[] }> = {}
    for (const l of listings ?? []) {
      if (!statsMap[l.seller]) statsMap[l.seller] = { total: 0, sold: 0, prices: [] }
      statsMap[l.seller].total++
      if (l.sold) statsMap[l.seller].sold++
      if (l.price) statsMap[l.seller].prices.push(l.price)
    }

    const result = (sellers ?? []).map(s => {
      const stats = statsMap[s.username] ?? { total: 0, sold: 0, prices: [] }
      const avg = stats.prices.length ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length : 0
      return { ...s, total_listings: stats.total, sold_count: stats.sold, avg_price: avg }
    })

    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
