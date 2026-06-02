import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: listings, error } = await supabase
      .from('depop_listings')
      .select('id,title,price,seller,listing_url,image_url,first_seen,sold,sold_at,score,ai_reason,query')
      .eq('ai_match', 1)
      .order('score', { ascending: false })
      .order('first_seen', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: sellers } = await supabase
      .from('depop_sellers')
      .select('username,match_count')

    const sellerMap: Record<string, number> = {}
    for (const s of sellers ?? []) sellerMap[s.username] = s.match_count

    const result = (listings ?? []).map(l => ({
      ...l,
      seller_matches: sellerMap[l.seller] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
