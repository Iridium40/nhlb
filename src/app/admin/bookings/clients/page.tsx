'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Client } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

interface SearchClient extends Client {
  _match_hipaa?: boolean
  _match_notes?: boolean
  _assigned_counselor?: { id: string; name: string; photo_url: string | null } | null
}

export default function ClientListPage() {
  const [clients, setClients] = useState<SearchClient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const param = search.trim() ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`/api/clients${param}`)
    const json = await res.json()
    setClients(json.clients ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, HIPAA info, or session notes..."
          style={{
            width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
            padding: '12px 16px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
            color: 'var(--nhlb-text)', background: 'white', outline: 'none', marginBottom: 24,
          }}
          className="input-brand"
        />

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
        ) : clients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
            {search ? 'No clients match your search' : 'No clients yet'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clients.map(c => (
              <a key={c.id} href={`/admin/bookings/clients/${c.id}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'white', border: '1px solid var(--nhlb-border)',
                  borderRadius: 10, padding: '16px 20px', textDecoration: 'none',
                  transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget).style.borderColor = 'var(--nhlb-red)'}
                onMouseLeave={e => (e.currentTarget).style.borderColor = 'var(--nhlb-border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  {c._assigned_counselor ? (
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--nhlb-blush-light)',
                    }}>
                      {c._assigned_counselor.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c._assigned_counselor.photo_url} alt={c._assigned_counselor.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'var(--nhlb-cream-dark)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--nhlb-muted)', fontFamily: 'Lato, sans-serif' }}>—</span>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                        {c.first_name} {c.last_name}
                      </p>
                      {search && c._match_hipaa && (
                        <span style={{
                          padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700,
                          fontFamily: 'Lato, sans-serif', backgroundColor: '#EFF6FF', color: '#1D4ED8',
                        }}>HIPAA match</span>
                      )}
                      {search && c._match_notes && (
                        <span style={{
                          padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700,
                          fontFamily: 'Lato, sans-serif', backgroundColor: '#FEF3C7', color: '#92400E',
                        }}>Notes match</span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                      {c.email}{c.phone ? ` · ${c.phone}` : ''}
                      {c.service_type ? ` · ${c.service_type}` : ''}
                    </p>
                    {c._assigned_counselor && (
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-blush)', margin: '3px 0 0' }}>
                        Assigned to {c._assigned_counselor.name}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-blush)' }}>&rarr;</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
