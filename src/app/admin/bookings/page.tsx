'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  format, startOfWeek, startOfMonth, endOfMonth, addDays, addMonths, subMonths,
  isSameDay, isSameMonth, isToday, getDay,
} from 'date-fns'
import type { Booking } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

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

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7)

type ViewMode = 'list' | 'week' | 'month'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all')
  const [counselorFilter, setCounselorFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthDate, setMonthDate] = useState(() => new Date())

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
  const views: { key: ViewMode; label: string }[] = [
    { key: 'list', label: 'List' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ]

  const counselorNames = [...new Set(bookings.map(b => b.counselor?.name).filter(Boolean))]
  const counselorColorMap: Record<string, typeof COUNSELOR_COLORS[0]> = {}
  counselorNames.forEach((name, i) => {
    if (name) counselorColorMap[name] = COUNSELOR_COLORS[i % COUNSELOR_COLORS.length]
  })

  // Month calendar grid
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calendarStart = addDays(monthStart, -(getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1))
  const monthWeeks: Date[][] = []
  let cur = calendarStart
  while (cur <= monthEnd || monthWeeks.length < 5) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(cur); cur = addDays(cur, 1) }
    monthWeeks.push(week)
    if (cur > monthEnd && monthWeeks.length >= 5) break
  }

  const matchesFilters = (b: Booking) =>
    (filter === 'all' || b.status === filter)
    && (counselorFilter === 'all' || b.counselor?.name === counselorFilter)

  const filteredBookings = (day: Date) =>
    bookings.filter(b => isSameDay(new Date(b.scheduled_at), day) && matchesFilters(b))

  const visibleBookings = bookings.filter(matchesFilters)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: view === 'list' ? 900 : 1100, margin: '0 auto', padding: '32px 24px', transition: 'max-width 0.2s' }}>

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
            {counselorNames.length > 1 && (
              <select
                value={counselorFilter}
                onChange={e => setCounselorFilter(e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: counselorFilter !== 'all' ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                  backgroundColor: counselorFilter !== 'all' ? 'var(--nhlb-red)' : 'white',
                  color: counselorFilter !== 'all' ? 'white' : 'var(--nhlb-muted)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer', appearance: 'none',
                  paddingRight: 28, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%239A5A50\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
                }}>
                <option value="all">All Counselors</option>
                {counselorNames.map(n => n && (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {views.map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid',
                borderColor: view === v.key ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                backgroundColor: view === v.key ? 'var(--nhlb-red)' : 'white',
                color: view === v.key ? 'white' : 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* Week nav + legend (for week view) */}
        {view === 'week' && (
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
            <CounselorLegend names={counselorNames} colorMap={counselorColorMap} />
          </div>
        )}

        {/* Month nav + legend (for month view) */}
        {view === 'month' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setMonthDate(subMonths(monthDate, 1))} style={{
                background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
                padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
              }}>&larr;</button>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--nhlb-text)', minWidth: 160, textAlign: 'center' }}>
                {format(monthDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => setMonthDate(addMonths(monthDate, 1))} style={{
                background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
                padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
              }}>&rarr;</button>
              <button onClick={() => setMonthDate(new Date())} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                backgroundColor: 'white', color: 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
              }}>Today</button>
            </div>
            <CounselorLegend names={counselorNames} colorMap={counselorColorMap} />
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading sessions...
          </p>
        ) : (
          <>
            {/* ── Week View ── */}
            {view === 'week' && (
              <div style={{
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
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
                        return isSameDay(d, day) && d.getHours() === hour && matchesFilters(b)
                      })
                      return (
                        <div key={day.toISOString()} style={{
                          borderLeft: '1px solid var(--nhlb-border)',
                          padding: 2, position: 'relative',
                          backgroundColor: isToday(day) ? 'rgba(184,49,31,0.03)' : 'transparent',
                        }}>
                          {dayBookings.map(b => (
                            <BookingChip key={b.id} booking={b} colorMap={counselorColorMap} />
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* ── Month View ── */}
            {view === 'month' && (
              <div style={{
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Day-of-week header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--nhlb-border)' }}>
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                    <div key={d} style={{
                      padding: '10px 8px', textAlign: 'center',
                      backgroundColor: 'var(--nhlb-cream-dark)',
                      borderLeft: '1px solid var(--nhlb-border)',
                      fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700,
                      letterSpacing: '0.06em', color: 'var(--nhlb-muted)',
                    }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Week rows */}
                {monthWeeks.map((week, wi) => (
                  <div key={wi} style={{
                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                    minHeight: 100, borderBottom: wi < monthWeeks.length - 1 ? '1px solid var(--nhlb-border)' : 'none',
                  }}>
                    {week.map(day => {
                      const inMonth = isSameMonth(day, monthDate)
                      const today = isToday(day)
                      const dayBk = filteredBookings(day)
                      return (
                        <div key={day.toISOString()} style={{
                          borderLeft: '1px solid var(--nhlb-border)',
                          padding: '4px 6px',
                          backgroundColor: today ? 'rgba(184,49,31,0.04)' : !inMonth ? 'rgba(0,0,0,0.015)' : 'transparent',
                          opacity: inMonth ? 1 : 0.45,
                          minHeight: 100,
                        }}>
                          <div style={{
                            fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                            marginBottom: 4, textAlign: 'right',
                            color: today ? 'white' : 'var(--nhlb-text)',
                          }}>
                            {today ? (
                              <span style={{
                                backgroundColor: 'var(--nhlb-red)', color: 'white',
                                borderRadius: '50%', width: 24, height: 24,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem',
                              }}>
                                {format(day, 'd')}
                              </span>
                            ) : (
                              format(day, 'd')
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {dayBk.slice(0, 3).map(b => (
                              <BookingChip key={b.id} booking={b} colorMap={counselorColorMap} compact />
                            ))}
                            {dayBk.length > 3 && (
                              <span style={{
                                fontFamily: 'Lato, sans-serif', fontSize: '0.6rem', fontWeight: 700,
                                color: 'var(--nhlb-muted)', textAlign: 'center',
                              }}>
                                +{dayBk.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* ── List View ── */}
            {view === 'list' && (
              visibleBookings.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
                  No bookings found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visibleBookings.map(b => (
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
                              {b.type === 'VIRTUAL' ? 'Virtual' : 'In Person'}
                            </span>
                          </div>
                          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
                            {format(new Date(b.scheduled_at), 'EEE, MMM d')} at {format(new Date(b.scheduled_at), 'h:mm a')}
                            &ensp;&middot;&ensp;{b.counselor?.name}
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

function BookingChip({ booking: b, colorMap, compact }: {
  booking: Booking
  colorMap: Record<string, typeof COUNSELOR_COLORS[0]>
  compact?: boolean
}) {
  const cName = b.counselor?.name ?? ''
  const cc = colorMap[cName] ?? COUNSELOR_COLORS[0]
  const cancelled = b.status === 'CANCELLED'
  return (
    <a href={`/admin/bookings/clients/${b.client_id}`}
      style={{
        display: 'block', textDecoration: 'none',
        backgroundColor: cancelled ? '#FEE2E2' : cc.bg,
        borderRadius: 4, padding: compact ? '2px 5px' : '3px 6px', marginBottom: compact ? 0 : 2,
        borderLeft: `3px solid ${cancelled ? '#DC2626' : cc.border}`,
        opacity: cancelled ? 0.5 : 1,
      }}>
      <span style={{
        fontFamily: 'Lato, sans-serif', fontWeight: 700,
        fontSize: compact ? '0.6rem' : '0.68rem', color: 'var(--nhlb-text)',
        lineHeight: 1.3, display: 'block',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {compact ? `${format(new Date(b.scheduled_at), 'h:mma')} ` : ''}
        {b.client?.first_name} {b.client?.last_name?.[0]}.
      </span>
      {!compact && (
        <span style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.58rem',
          color: 'var(--nhlb-muted)', lineHeight: 1.2, display: 'block',
        }}>
          {cName.split(' ')[0]}
          {b.type === 'VIRTUAL' ? ' · Virtual' : ''}
        </span>
      )}
    </a>
  )
}

function CounselorLegend({ names, colorMap }: {
  names: (string | undefined)[]
  colorMap: Record<string, typeof COUNSELOR_COLORS[0]>
}) {
  if (names.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {names.map(name => name && (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colorMap[name]?.border }} />
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)' }}>{name}</span>
        </div>
      ))}
    </div>
  )
}
