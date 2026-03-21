'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Client } from '@/types'

export default function ClientListPage() {
  const [clients, setClients] = useState<Client[]>([])
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
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Admin
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin/bookings" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>&larr; Bookings</a>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
          }}>Clients</h1>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
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
                <div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 2px' }}>
                    {c.first_name} {c.last_name}
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                    {c.email}{c.phone ? ` · ${c.phone}` : ''}
                  </p>
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
