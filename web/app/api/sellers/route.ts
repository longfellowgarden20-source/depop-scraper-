import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT s.username, s.match_count, s.last_seen,
             COUNT(l.id) as total_listings,
             SUM(CASE WHEN l.sold = 1 THEN 1 ELSE 0 END) as sold_count,
             AVG(l.price) as avg_price
      FROM sellers s
      LEFT JOIN listings l ON l.seller = s.username
      GROUP BY s.username
      ORDER BY s.match_count DESC, total_listings DESC
      LIMIT 50
    `).all()
    return NextResponse.json(rows)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'DB error' }, { status: 500 })
  }
}
