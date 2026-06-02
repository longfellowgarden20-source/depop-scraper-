'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Star } from 'lucide-react'

type Seller = {
  username: string
  match_count: number
  last_seen: string
  total_listings: number
  sold_count: number
  avg_price: number
}

export default function SellersClient() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sellers')
      .then(r => r.json())
      .then(data => { setSellers(data); setLoading(false) })
  }, [])

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Top Sellers</h1>
        <p className="text-xs text-slate-400">Sellers whose listings matched your AI criteria most often</p>
      </div>

      {sellers.length === 0 && (
        <p className="text-slate-500 text-sm">No sellers tracked yet. Run the scraper and vision check first.</p>
      )}

      <div className="flex flex-col gap-2">
        {sellers.map(s => (
          <div
            key={s.username}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10"
            style={{ background: '#0d1626' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: s.match_count > 0 ? '#0ea5e922' : '#ffffff0a', color: s.match_count > 0 ? '#0ea5e9' : '#6b7280' }}
              >
                {s.username[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">@{s.username}</span>
                  {s.match_count > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                      <Star className="w-3 h-3" /> {s.match_count} match{s.match_count !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.total_listings} listings tracked · {s.sold_count} sold · avg ${s.avg_price?.toFixed(0) ?? '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-500 hidden sm:block">{s.last_seen?.slice(0, 10)}</span>
              <a
                href={`https://www.depop.com/${s.username}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:opacity-80"
                style={{ color: '#0ea5e9', transition: 'opacity 0.15s' }}
              >
                Shop <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
