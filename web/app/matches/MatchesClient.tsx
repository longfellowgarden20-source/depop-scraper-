'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Tag, Star } from 'lucide-react'

type Match = {
  id: string
  title: string
  price: number
  seller: string
  listing_url: string
  image_url: string
  first_seen: string
  sold: number
  sold_at: string | null
  score: number
  ai_reason: string | null
  query: string
  seller_matches: number
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#ef4444' : score >= 5 ? '#f59e0b' : '#6b7280'
  return (
    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: color + '22', color }}>
      {score}/10
    </span>
  )
}

export default function MatchesClient() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
  }, [])

  const filtered = matches.filter(m => {
    if (filter === 'available') return m.sold === 0
    if (filter === 'sold') return m.sold === 1
    return true
  })

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white">AI Matches</h1>
          <p className="text-xs text-slate-400">{matches.length} listings matched your criteria</p>
        </div>
        <div className="flex gap-1">
          {(['all', 'available', 'sold'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
              style={{
                background: filter === f ? '#0ea5e9' : '#ffffff10',
                color: filter === f ? 'black' : '#94a3b8',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm">No matches yet. Run <code className="text-slate-300">python scraper.py</code> then <code className="text-slate-300">python vision.py</code>.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => (
          <div
            key={m.id}
            className="rounded-xl border border-white/10 overflow-hidden flex flex-col"
            style={{ background: '#0d1626' }}
          >
            {/* Photo */}
            <div className="relative aspect-square bg-white/5">
              {m.image_url ? (
                <img src={m.image_url} alt={m.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No photo</div>
              )}
              {m.sold === 1 && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#00000088' }}>
                  <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-full">SOLD</span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <ScoreBadge score={m.score} />
              </div>
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white text-sm font-medium leading-snug line-clamp-2">{m.title}</p>
                <span className="text-white font-bold text-sm shrink-0">${m.price.toFixed(0)}</span>
              </div>

              {m.ai_reason && (
                <p className="text-xs text-slate-400 italic leading-snug">{m.ai_reason}</p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-1">
                <Tag className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-400">@{m.seller}</span>
                {m.seller_matches > 1 && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                    {m.seller_matches} matches
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{m.first_seen?.slice(0, 16).replace('T', ' ')}</span>
                <a
                  href={m.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium hover:opacity-80"
                  style={{ color: '#0ea5e9', transition: 'opacity 0.15s' }}
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
