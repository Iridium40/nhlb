'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import type { Booking } from '@/types'

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  CONFIRMED: { backgroundColor: '#D1FAE5', color: '#065F46' },
  CANCELLED: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  COMPLETED: { backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)' },
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/booking/availability?admin=true&status=${filter}`)
    if (!res.ok) { setLoading(false); return }
    const json = await res.json()
    setBookings(json.bookings ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (bookingId: string, status: string) => {
    await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const filters = ['all', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Admin Dashboard
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
            alt="NHLB" style={{ height: 40, width: 'auto' }}
          />
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
          }}>Bookings</h1>
        </div>

        <nav style={{ display: 'flex', gap: 12 }}>
          <a href="/admin/bookings/clients" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', textDecoration: 'none',
          }}>Clients</a>
          <a href="/admin/bookings/counselors" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', textDecoration: 'none',
          }}>Counselors</a>
        </nav>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {filters.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '1px solid',
                borderColor: filter === s ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                backgroundColor: filter === s ? 'var(--nhlb-red)' : 'white',
                color: filter === s ? 'white' : 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.04em', textTransform: 'capitalize', cursor: 'pointer',
              }}>
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading sessions...
          </p>
        ) : bookings.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
            No bookings found
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map(b => (
              <div key={b.id} style={{
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 12, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                        {b.client?.first_name} {b.client?.last_name}
                      </p>
                      <span style={{
                        ...STATUS_STYLES[b.status],
                        padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem',
                        fontWeight: 700, fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
                      }}>
                        {b.status.toLowerCase()}
                      </span>
                      <span style={{
                        backgroundColor: b.type === 'VIRTUAL' ? '#EFF6FF' : 'var(--nhlb-cream-dark)',
                        color: b.type === 'VIRTUAL' ? '#1D4ED8' : 'var(--nhlb-muted)',
                        padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontFamily: 'Lato, sans-serif',
                      }}>
                        {b.type === 'VIRTUAL' ? '💻 Virtual' : '🏠 In Person'}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
                      📅 {format(new Date(b.scheduled_at), 'EEE, MMM d')} at {format(new Date(b.scheduled_at), 'h:mm a')}
                      &ensp;&middot;&ensp;👤 {b.counselor?.name}
                    </p>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                      {b.client?.email}{b.client?.phone ? ` · ${b.client.phone}` : ''}
                      {b.donation_amount_cents > 0 ? ` · $${(b.donation_amount_cents / 100).toFixed(2)} donation` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {b.status === 'CONFIRMED' && (
                      <button onClick={() => updateStatus(b.id, 'COMPLETED')} style={{
                        padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        backgroundColor: 'var(--nhlb-muted)', color: 'white',
                        fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
                      }}>Complete</button>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button onClick={() => updateStatus(b.id, 'CANCELLED')} style={{
                        padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid #FECACA', backgroundColor: 'white', color: '#DC2626',
                        fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
                      }}>Cancel</button>
                    )}
                    <a href={`/admin/bookings/clients/${b.client_id}`} style={{
                      padding: '7px 14px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
                      backgroundColor: 'white', color: 'var(--nhlb-muted)', textDecoration: 'none',
                      fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
                      display: 'inline-flex', alignItems: 'center',
                    }}>View client</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
