'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'

type Listing = {
  id: string
  title: string
  price: number
  seller: string
  listing_url: string
  image_url: string
  first_seen: string
  sold: number
  score: number
  ai_match: number
  query: string
}

export default function ListingsClient() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => { setListings(data); setLoading(false) })
  }, [])

  const filtered = listings.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.seller.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-white">All Listings</h1>
          <p className="text-xs text-slate-400">{listings.length} tracked</p>
        </div>
        <input
          type="text"
          placeholder="Search title or seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-[#0ea5e9]"
          style={{ background: '#0d1626', width: 220 }}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Seen</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr
                key={l.id}
                className="border-b border-white/5 hover:bg-white/3"
                style={{ background: i % 2 === 0 ? '#0d1626' : '#0a1020' }}
              >
                <td className="px-4 py-2.5 max-w-xs">
                  <span className="text-white line-clamp-1">{l.title}</span>
                  <span className="text-[11px] text-slate-500 block">{l.query}</span>
                </td>
                <td className="px-4 py-2.5 text-white font-medium">${l.price.toFixed(0)}</td>
                <td className="px-4 py-2.5 text-slate-300">@{l.seller}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: l.score >= 8 ? '#ef444422' : l.score >= 5 ? '#f59e0b22' : '#6b728022',
                      color: l.score >= 8 ? '#ef4444' : l.score >= 5 ? '#f59e0b' : '#6b7280',
                    }}
                  >
                    {l.score}/10
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {l.sold === 1 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#ef444422', color: '#ef4444' }}>Sold</span>
                  ) : l.ai_match === 1 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#22c55e22', color: '#22c55e' }}>AI Match</span>
                  ) : l.ai_match === -1 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#6b728022', color: '#6b7280' }}>Screened</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#0ea5e922', color: '#0ea5e9' }}>New</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{l.first_seen?.slice(0, 10)}</td>
                <td className="px-4 py-2.5">
                  <a
                    href={l.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80"
                    style={{ color: '#0ea5e9', transition: 'opacity 0.15s' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No listings found.</p>
        )}
      </div>
    </div>
  )
}
