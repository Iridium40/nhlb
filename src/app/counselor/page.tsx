'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, addDays, isSameDay, isToday, isBefore } from 'date-fns'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Counselor, Booking, SessionNote } from '@/types'

interface EnrichedBooking extends Booking {
  session_note?: SessionNote | null
  previous_note?: { content: string; private_notes: string } | null
  previous_session_date?: string | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: '#D1FAE5', text: '#065F46' },
  CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
  COMPLETED: { bg: 'var(--nhlb-cream-dark)', text: 'var(--nhlb-muted)' },
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8)

function SessionNoteEditor({ booking, onSaved }: {
  booking: EnrichedBooking
  onSaved: () => void
}) {
  const existing = booking.session_note
  const [content, setContent] = useState(existing?.content ?? '')
  const [privateNotes, setPrivateNotes] = useState(existing?.private_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    setSaved(false)
    await fetch('/api/counselor/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: booking.id, content, private_notes: privateNotes }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  return (
    <div style={{
      marginTop: 12, padding: '16px 18px',
      backgroundColor: 'var(--nhlb-cream-dark)', border: '1px solid var(--nhlb-blush-light)',
      borderRadius: 10,
    }}>
      <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: 'var(--nhlb-muted)', letterSpacing: '0.06em', margin: '0 0 10px' }}>
        SESSION NOTES {existing ? '(editing)' : '(new)'}
      </p>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--nhlb-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
          Notes
        </label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          style={{
            width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
            padding: '10px 14px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif',
            color: 'var(--nhlb-text)', background: 'white', outline: 'none', resize: 'none',
          }} rows={3}
          placeholder="Session summary, goals discussed, homework assigned..." />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--nhlb-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
          Private Notes (only you see these)
        </label>
        <textarea value={privateNotes} onChange={e => setPrivateNotes(e.target.value)}
          style={{
            width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
            padding: '10px 14px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif',
            color: 'var(--nhlb-text)', background: 'white', outline: 'none', resize: 'none',
          }} rows={2}
          placeholder="Clinical observations, treatment plan notes..." />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={saving} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Saving...' : existing ? 'Update Notes' : 'Save Notes'}
        </button>
        {saved && <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#065F46' }}>Saved</span>}
      </div>
    </div>
  )
}

function PreviousNotes({ booking }: { booking: EnrichedBooking }) {
  const [expanded, setExpanded] = useState(false)
  if (!booking.previous_note?.content) return null

  return (
    <div style={{
      marginTop: 8, padding: '10px 14px',
      backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8,
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
        color: '#1D4ED8',
      }}>
        {expanded ? '▾' : '▸'} Previous Session Notes
        {booking.previous_session_date && (
          <span style={{ fontWeight: 400, marginLeft: 6 }}>
            ({format(new Date(booking.previous_session_date), 'MMM d, yyyy')})
          </span>
        )}
      </button>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#1E3A5F', lineHeight: 1.5, margin: '0 0 4px', whiteSpace: 'pre-wrap' }}>
            {booking.previous_note.content}
          </p>
          {booking.previous_note.private_notes && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #BFDBFE' }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#1D4ED8', margin: '0 0 2px', letterSpacing: '0.06em' }}>
                PRIVATE
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#1E3A5F', lineHeight: 1.5, margin: 0, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                {booking.previous_note.private_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CounselorDashboard() {
  const router = useRouter()
  const [counselor, setCounselor] = useState<Counselor | null>(null)
  const [bookings, setBookings] = useState<EnrichedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [view, setView] = useState<'week' | 'list'>('week')
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const meRes = await fetch('/api/counselor/me')
    if (!meRes.ok) { router.push('/counselor/login'); return }
    const meJson = await meRes.json()
    setCounselor(meJson.counselor)

    const schedRes = await fetch('/api/counselor/schedule?days=60&past=true')
    const schedJson = await schedRes.json()
    setBookings(schedJson.bookings ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/counselor/login')
  }

  const updateBooking = async (bookingId: string, status: string) => {
    await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading your schedule...</p>
    </div>
  )

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const upcomingBookings = bookings
    .filter(b => b.status === 'CONFIRMED' && !isBefore(new Date(b.scheduled_at), new Date()))
    .slice(0, 5)

  const todayBookings = bookings.filter(b => isToday(new Date(b.scheduled_at)) && b.status !== 'CANCELLED')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Counselor Portal
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
            alt="NHLB" style={{ height: 36, width: 'auto' }}
          />
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
          }}>
            {counselor?.name}&apos;s Schedule
          </h1>
        </div>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/counselor/availability" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', textDecoration: 'none',
          }}>Availability &amp; Time Off</a>
          <button onClick={handleLogout} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
            backgroundColor: 'white', color: 'var(--nhlb-muted)',
            fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', cursor: 'pointer',
          }}>Sign Out</button>
        </nav>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px' }}>

        {/* Today's summary + upcoming */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 8px' }}>
              TODAY &mdash; {format(new Date(), 'EEEE, MMMM d')}
            </p>
            {todayBookings.length === 0 ? (
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--nhlb-muted)' }}>No sessions today</p>
            ) : (
              todayBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--nhlb-red-dark)',
                    minWidth: 70,
                  }}>
                    {format(new Date(b.scheduled_at), 'h:mm a')}
                  </span>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)' }}>
                    {b.client?.first_name} {b.client?.last_name}
                  </span>
                  <span style={{
                    padding: '1px 8px', borderRadius: 20, fontSize: '0.65rem',
                    fontWeight: 700, fontFamily: 'Lato, sans-serif',
                    backgroundColor: b.type === 'VIRTUAL' ? '#EFF6FF' : 'var(--nhlb-cream-dark)',
                    color: b.type === 'VIRTUAL' ? '#1D4ED8' : 'var(--nhlb-muted)',
                  }}>
                    {b.type === 'VIRTUAL' ? 'Virtual' : 'In Person'}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 8px' }}>
              UPCOMING
            </p>
            {upcomingBookings.length === 0 ? (
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--nhlb-muted)' }}>No upcoming sessions</p>
            ) : (
              upcomingBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', minWidth: 90 }}>
                    {format(new Date(b.scheduled_at), 'EEE, MMM d')}
                  </span>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-red-dark)', minWidth: 60 }}>
                    {format(new Date(b.scheduled_at), 'h:mm a')}
                  </span>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)' }}>
                    {b.client?.first_name} {b.client?.last_name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* View toggle + week nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setView('week')} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid',
              borderColor: view === 'week' ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
              backgroundColor: view === 'week' ? 'var(--nhlb-red)' : 'white',
              color: view === 'week' ? 'white' : 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            }}>Week</button>
            <button onClick={() => setView('list')} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid',
              borderColor: view === 'list' ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
              backgroundColor: view === 'list' ? 'var(--nhlb-red)' : 'white',
              color: view === 'list' ? 'white' : 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            }}>List</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{
              background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
            }}>&larr;</button>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-text)', minWidth: 160, textAlign: 'center' }}>
              {format(weekStart, 'MMM d')} &ndash; {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{
              background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
            }}>&rarr;</button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
              backgroundColor: 'white', color: 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
            }}>Today</button>
          </div>
        </div>

        {/* Week calendar grid */}
        {view === 'week' && (
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

            {/* Time rows */}
            {HOURS.map(hour => (
              <div key={hour} style={{
                display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)',
                minHeight: 56, borderBottom: '1px solid var(--nhlb-border)',
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
                    return isSameDay(d, day) && d.getHours() === hour && b.status !== 'CANCELLED'
                  })
                  return (
                    <div key={day.toISOString()} style={{
                      borderLeft: '1px solid var(--nhlb-border)',
                      padding: 2, position: 'relative',
                      backgroundColor: isToday(day) ? 'rgba(184,49,31,0.03)' : 'transparent',
                    }}>
                      {dayBookings.map(b => {
                        const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.CONFIRMED
                        return (
                          <div key={b.id} style={{
                            backgroundColor: colors.bg, color: colors.text,
                            borderRadius: 4, padding: '3px 6px', fontSize: '0.7rem',
                            fontFamily: 'Lato, sans-serif', fontWeight: 700,
                            lineHeight: 1.3, overflow: 'hidden',
                            borderLeft: `3px solid ${b.type === 'VIRTUAL' ? '#3B82F6' : 'var(--nhlb-red)'}`,
                          }}>
                            <span>{b.client?.first_name} {b.client?.last_name?.[0]}.</span>
                            <br />
                            <span style={{ fontWeight: 400, fontSize: '0.6rem', opacity: 0.8 }}>
                              {b.type === 'VIRTUAL' ? '💻' : '🏠'} {b.client?.service_type}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.filter(b => {
              const d = new Date(b.scheduled_at)
              return d >= weekDays[0] && d <= addDays(weekDays[6], 1) && b.status !== 'CANCELLED'
            }).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
                No sessions this week
              </p>
            ) : (
              bookings.filter(b => {
                const d = new Date(b.scheduled_at)
                return d >= weekDays[0] && d <= addDays(weekDays[6], 1) && b.status !== 'CANCELLED'
              }).map(b => {
                const isNotesOpen = expandedNotes === b.id
                const hasNotes = !!b.session_note?.content
                return (
                  <div key={b.id} style={{
                    background: 'white', border: '1px solid var(--nhlb-border)',
                    borderRadius: 10, padding: '16px 20px',
                    borderLeft: `4px solid ${b.type === 'VIRTUAL' ? '#3B82F6' : 'var(--nhlb-red)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--nhlb-red-dark)' }}>
                            {format(new Date(b.scheduled_at), 'EEE, MMM d')} at {format(new Date(b.scheduled_at), 'h:mm a')}
                          </span>
                          <span style={{
                            backgroundColor: STATUS_COLORS[b.status]?.bg,
                            color: STATUS_COLORS[b.status]?.text,
                            padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
                            fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
                          }}>
                            {b.status.toLowerCase()}
                          </span>
                          {hasNotes && (
                            <span style={{
                              padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700,
                              fontFamily: 'Lato, sans-serif', backgroundColor: '#FEF3C7', color: '#92400E',
                            }}>
                              Has Notes
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--nhlb-text)', margin: '0 0 2px' }}>
                          {b.client?.first_name} {b.client?.last_name}
                        </p>
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                          {b.type === 'VIRTUAL' ? '💻 Virtual' : '🏠 In Person'}
                          {' · '}{b.client?.service_type}
                          {b.client?.email ? ` · ${b.client.email}` : ''}
                          {b.client?.phone ? ` · ${b.client.phone}` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => setExpandedNotes(isNotesOpen ? null : b.id)} style={{
                          padding: '6px 12px', borderRadius: 6,
                          border: `1px solid ${hasNotes ? '#FEF3C7' : 'var(--nhlb-border)'}`,
                          backgroundColor: hasNotes ? '#FEF3C7' : 'white',
                          color: hasNotes ? '#92400E' : 'var(--nhlb-muted)',
                          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                        }}>
                          {isNotesOpen ? 'Close Notes' : hasNotes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                        {b.status === 'CONFIRMED' && (
                          <button onClick={() => updateBooking(b.id, 'COMPLETED')} style={{
                            padding: '6px 12px', borderRadius: 6, border: 'none',
                            backgroundColor: '#065F46', color: 'white',
                            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                          }}>Complete</button>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button onClick={() => updateBooking(b.id, 'CANCELLED')} style={{
                            padding: '6px 12px', borderRadius: 6, border: '1px solid #FECACA',
                            backgroundColor: 'white', color: '#DC2626',
                            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                          }}>Cancel</button>
                        )}
                      </div>
                    </div>

                    {/* Previous session notes for upcoming sessions */}
                    {b.status === 'CONFIRMED' && <PreviousNotes booking={b} />}

                    {/* Inline note preview when collapsed */}
                    {!isNotesOpen && hasNotes && (
                      <div style={{
                        marginTop: 10, padding: '10px 14px',
                        backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 8,
                      }}>
                        <p style={{
                          fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
                          color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.5,
                        }}>
                          {(b.session_note?.content ?? '').length > 150
                            ? b.session_note!.content.slice(0, 150) + '...'
                            : b.session_note?.content}
                        </p>
                      </div>
                    )}

                    {/* Notes editor when expanded */}
                    {isNotesOpen && <SessionNoteEditor booking={b} onSaved={load} />}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
