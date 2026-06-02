import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT id, title, price, seller, listing_url, image_url,
             first_seen, sold, sold_at, score, ai_match, query
      FROM listings
      ORDER BY first_seen DESC
      LIMIT 200
    `).all()
    return NextResponse.json(rows)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'DB error' }, { status: 500 })
  }
}
