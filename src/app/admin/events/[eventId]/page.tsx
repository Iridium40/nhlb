'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import type { Event, EventRegistration } from '@/types'

export default function EventAttendeesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [regs, setRegs] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [evRes, regRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/registrations`),
    ])
    const evJson = await evRes.json()
    const regJson = await regRes.json()
    setEvent(evJson.event)
    setRegs(regJson.registrations ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  const active = regs.filter(r => r.status === 'REGISTERED')
  const totalRevenue = active.reduce((s, r) => s + r.amount_paid_cents, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Event Management
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin/events" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>&larr; All Events</a>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
          }}>{event?.title}</h1>
        </div>
        <a href={`/api/events/${eventId}/registrations/export`} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
          textDecoration: 'none',
        }}>
          Export CSV ↓
        </a>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
              {active.length}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
              Registered{event?.max_capacity ? ` / ${event.max_capacity}` : ''}
            </p>
          </div>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: '#065F46', margin: 0 }}>
              ${(totalRevenue / 100).toFixed(2)}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
              Total Collected
            </p>
          </div>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-muted)', margin: 0 }}>
              {event ? format(new Date(event.event_date), 'MMM d') : '—'}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
              Event Date
            </p>
          </div>
        </div>

        {/* Attendee table */}
        {active.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
            No registrations yet
          </p>
        ) : (
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--nhlb-cream-dark)' }}>
                  {['Name', 'Email', 'Phone', 'Paid', 'Registered'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.06em', color: 'var(--nhlb-muted)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: i > 0 ? '1px solid var(--nhlb-border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--nhlb-text)' }}>
                      {r.first_name} {r.last_name}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)' }}>
                      {r.email}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)' }}>
                      {r.phone ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)' }}>
                      {r.amount_paid_cents > 0 ? `$${(r.amount_paid_cents / 100).toFixed(2)}` : 'Free'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
                      {format(new Date(r.created_at), 'MMM d, h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
