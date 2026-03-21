'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import type { Booking } from '@/types'

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  CONFIRMED: { backgroundColor: '#D1FAE5', color: '#065F46' },
  CANCELLED: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  COMPLETED: { backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)' },
}

const COUNSELOR_COLORS = [
  { border: 'var(--nhlb-red)', bg: '#FDF2F2' },
  { border: '#1D4ED8', bg: '#EFF6FF' },
  { border: '#7C3AED', bg: '#F5F3FF' },
  { border: '#059669', bg: '#ECFDF5' },
  { border: '#D97706', bg: '#FFFBEB' },
]

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7am–5pm

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

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
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const counselorNames = [...new Set(bookings.map(b => b.counselor?.name).filter(Boolean))]
  const counselorColorMap: Record<string, typeof COUNSELOR_COLORS[0]> = {}
  counselorNames.forEach((name, i) => {
    if (name) counselorColorMap[name] = COUNSELOR_COLORS[i % COUNSELOR_COLORS.length]
  })

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
          <a href="/admin/events" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', textDecoration: 'none',
          }}>Events</a>
          <a href="/admin/donations" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', textDecoration: 'none',
          }}>Donations</a>
          <a href="/admin/reports" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', textDecoration: 'none',
          }}>Reports</a>
        </nav>
      </header>

      <div style={{ maxWidth: view === 'calendar' ? 1100 : 900, margin: '0 auto', padding: '32px 24px', transition: 'max-width 0.2s' }}>

        {/* Toolbar: filters + view toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
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
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setView('list')} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid',
              borderColor: view === 'list' ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
              backgroundColor: view === 'list' ? 'var(--nhlb-red)' : 'white',
              color: view === 'list' ? 'white' : 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            }}>List</button>
            <button onClick={() => setView('calendar')} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid',
              borderColor: view === 'calendar' ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
              backgroundColor: view === 'calendar' ? 'var(--nhlb-red)' : 'white',
              color: view === 'calendar' ? 'white' : 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            }}>Calendar</button>
          </div>
        </div>

        {/* Calendar week nav + legend */}
        {view === 'calendar' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{
                background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
                padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
              }}>&larr;</button>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-text)', minWidth: 180, textAlign: 'center' }}>
                {format(weekStart, 'MMM d')} &ndash; {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{
                background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
                padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
              }}>&rarr;</button>
              <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                backgroundColor: 'white', color: 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
              }}>Today</button>
            </div>
            {counselorNames.length > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {counselorNames.map(name => name && (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: counselorColorMap[name]?.border }} />
                    <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)' }}>{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading sessions...
          </p>
        ) : (
          <>
            {/* ── Calendar View ── */}
            {view === 'calendar' && (
              <div style={{
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--nhlb-border)' }}>
                  <div style={{ padding: 8 }} />
                  {weekDays.map(day => (
                    <div key={day.toISOString()} style={{
                      padding: '10px 8px', textAlign: 'center',
                      backgroundColor: isToday(day) ? 'var(--nhlb-red)' : 'var(--nhlb-cream-dark)',
                      color: isToday(day) ? 'white' : 'var(--nhlb-text)',
                      borderLeft: '1px solid var(--nhlb-border)',
                    }}>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', margin: 0 }}>
                        {format(day, 'EEE').toUpperCase()}
                      </p>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Hour rows */}
                {HOURS.map(hour => (
                  <div key={hour} style={{
                    display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)',
                    minHeight: 60, borderBottom: '1px solid var(--nhlb-border)',
                  }}>
                    <div style={{
                      padding: '4px 8px', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
                      color: 'var(--nhlb-muted)', textAlign: 'right', borderRight: '1px solid var(--nhlb-border)',
                    }}>
                      {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
                    </div>
                    {weekDays.map(day => {
                      const dayBookings = bookings.filter(b => {
                        const d = new Date(b.scheduled_at)
                        return isSameDay(d, day) && d.getHours() === hour
                          && (filter === 'all' || b.status === filter)
                      })
                      return (
                        <div key={day.toISOString()} style={{
                          borderLeft: '1px solid var(--nhlb-border)',
                          padding: 2, position: 'relative',
                          backgroundColor: isToday(day) ? 'rgba(184,49,31,0.03)' : 'transparent',
                        }}>
                          {dayBookings.map(b => {
                            const cName = b.counselor?.name ?? ''
                            const cc = counselorColorMap[cName] ?? COUNSELOR_COLORS[0]
                            return (
                              <a key={b.id} href={`/admin/bookings/clients/${b.client_id}`}
                                style={{
                                  display: 'block', textDecoration: 'none',
                                  backgroundColor: b.status === 'CANCELLED' ? '#FEE2E2' : cc.bg,
                                  borderRadius: 4, padding: '3px 6px', marginBottom: 2,
                                  borderLeft: `3px solid ${b.status === 'CANCELLED' ? '#DC2626' : cc.border}`,
                                  opacity: b.status === 'CANCELLED' ? 0.5 : 1,
                                }}>
                                <span style={{
                                  fontFamily: 'Lato, sans-serif', fontWeight: 700,
                                  fontSize: '0.68rem', color: 'var(--nhlb-text)',
                                  lineHeight: 1.3, display: 'block',
                                }}>
                                  {b.client?.first_name} {b.client?.last_name?.[0]}.
                                </span>
                                <span style={{
                                  fontFamily: 'Lato, sans-serif', fontSize: '0.58rem',
                                  color: 'var(--nhlb-muted)', lineHeight: 1.2, display: 'block',
                                }}>
                                  {cName.split(' ')[0]}
                                  {b.type === 'VIRTUAL' ? ' · 💻' : ''}
                                </span>
                              </a>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* ── List View ── */}
            {view === 'list' && (
              bookings.length === 0 ? (
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
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
