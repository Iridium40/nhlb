'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Client } from '@/types'
import CounselorNav from '@/components/counselor/CounselorNav'

interface EnrichedClient extends Client {
  session_count: number
  last_session_at: string | null
  _match_notes?: boolean
}

export default function CounselorClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<EnrichedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const meRes = await fetch('/api/counselor/me')
    if (!meRes.ok) { router.push('/counselor/login'); return }

    const q = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''
    const res = await fetch(`/api/counselor/clients${q}`)
    const json = await res.json()
    setClients(json.clients ?? [])
    setLoading(false)
  }, [router, debouncedSearch])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <CounselorNav />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or session notes..."
            style={{
              width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
              padding: '12px 16px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
              color: 'var(--nhlb-text)', background: 'white', outline: 'none',
            }}
            className="input-brand"
          />
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading clients...
          </p>
        ) : clients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
            {debouncedSearch ? 'No clients match your search' : 'No assigned clients yet'}
          </p>
        ) : (
          <>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', marginBottom: 12 }}>
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clients.map(c => (
                <a
                  key={c.id}
                  href={`/counselor/clients/${c.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'white', border: '1px solid var(--nhlb-border)',
                    borderRadius: 12, padding: '20px 24px', cursor: 'pointer',
                    transition: 'border-color 0.12s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 600,
                      }}>
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <p style={{
                            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem',
                            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
                          }}>
                            {c.first_name} {c.last_name}
                          </p>
                          {debouncedSearch && c._match_notes && (
                            <span style={{
                              padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700,
                              fontFamily: 'Lato, sans-serif', backgroundColor: '#FEF3C7', color: '#92400E',
                            }}>Notes match</span>
                          )}
                        </div>
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                          {c.email}{c.phone ? ` · ${c.phone}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            fontFamily: 'Lato, sans-serif', backgroundColor: 'var(--nhlb-cream-dark)',
                            color: 'var(--nhlb-muted)', textTransform: 'capitalize',
                          }}>
                            {c.service_type}
                          </span>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            fontFamily: 'Lato, sans-serif', backgroundColor: '#D1FAE5', color: '#065F46',
                          }}>
                            {c.session_count} session{c.session_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {c.last_session_at && (
                          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
                            Last: {format(new Date(c.last_session_at), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
