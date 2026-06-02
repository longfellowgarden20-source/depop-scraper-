import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT l.id, l.title, l.price, l.seller, l.listing_url, l.image_url,
             l.first_seen, l.sold, l.sold_at, l.score, l.ai_reason, l.query,
             COALESCE(s.match_count, 0) as seller_matches
      FROM listings l
      LEFT JOIN sellers s ON l.seller = s.username
      WHERE l.ai_match = 1
      ORDER BY l.score DESC, l.first_seen DESC
    `).all()
    return NextResponse.json(rows)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'DB error' }, { status: 500 })
  }
}
