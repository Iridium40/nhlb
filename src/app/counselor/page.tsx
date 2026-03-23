'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, addDays, isSameDay, isToday, isBefore } from 'date-fns'
import type { Counselor, Booking, SessionNote } from '@/types'
import CounselorNav from '@/components/counselor/CounselorNav'

interface EnrichedBooking extends Booking {
  session_note?: SessionNote | null
  previous_note?: { content: string; private_notes: string } | null
  previous_session_date?: string | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  requested:     { bg: '#F1EFE8', text: '#5F5E5A' },
  call_pending:  { bg: '#FAEEDA', text: '#633806' },
  call_complete: { bg: '#E6F1FB', text: '#0C447C' },
  confirmed:     { bg: '#E1F5EE', text: '#085041' },
  in_session:    { bg: '#EEEDFE', text: '#3C3489' },
  completed:     { bg: '#EAF3DE', text: '#27500A' },
  cancelled:     { bg: '#FCEBEB', text: '#791F1F' },
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8)

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
  const [listFilterDay, setListFilterDay] = useState<Date | null>(null)
  const [expandedPreCall, setExpandedPreCall] = useState<string | null>(null)
  const [expandedSessionNotes, setExpandedSessionNotes] = useState<string | null>(null)
  const [expandedPrivateNotes, setExpandedPrivateNotes] = useState<string | null>(null)
  const [localPreCallNotes, setLocalPreCallNotes] = useState<Record<string, string>>({})
  const [localSessionNoteContent, setLocalSessionNoteContent] = useState<Record<string, string>>({})
  const [localPrivateNotes, setLocalPrivateNotes] = useState<Record<string, string>>({})
  const [savingPreCall, setSavingPreCall] = useState<Record<string, boolean>>({})
  const [savingSessionNote, setSavingSessionNote] = useState<Record<string, boolean>>({})
  const [savingPrivateNote, setSavingPrivateNote] = useState<Record<string, boolean>>({})
  const [completeModal, setCompleteModal] = useState<{ bookingId: string; name: string } | null>(null)
  const [completeNotes, setCompleteNotes] = useState('')

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


  const updateBooking = async (bookingId: string, status: string, extra?: Record<string, unknown>) => {
    await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    })
    load()
  }

  const goToListDay = (day: Date) => {
    setListFilterDay(day)
    setView('list')
  }

  const savePreCallNotes = async (bookingId: string) => {
    setSavingPreCall(prev => ({ ...prev, [bookingId]: true }))
    await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pre_call_notes: localPreCallNotes[bookingId] ?? '' }),
    })
    setSavingPreCall(prev => ({ ...prev, [bookingId]: false }))
    load()
  }

  const saveSessionNote = async (bookingId: string, booking: EnrichedBooking) => {
    setSavingSessionNote(prev => ({ ...prev, [bookingId]: true }))
    await fetch('/api/counselor/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        content: localSessionNoteContent[bookingId] ?? booking.session_note?.content ?? '',
        private_notes: localPrivateNotes[bookingId] ?? booking.session_note?.private_notes ?? '',
      }),
    })
    setSavingSessionNote(prev => ({ ...prev, [bookingId]: false }))
    load()
  }

  const savePrivateNote = async (bookingId: string, booking: EnrichedBooking) => {
    setSavingPrivateNote(prev => ({ ...prev, [bookingId]: true }))
    await fetch('/api/counselor/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        content: localSessionNoteContent[bookingId] ?? booking.session_note?.content ?? '',
        private_notes: localPrivateNotes[bookingId] ?? booking.session_note?.private_notes ?? '',
      }),
    })
    setSavingPrivateNote(prev => ({ ...prev, [bookingId]: false }))
    load()
  }

  const isFutureSession = (scheduledAt: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const schedDay = new Date(scheduledAt)
    schedDay.setHours(0, 0, 0, 0)
    return schedDay > today
  }

  const handleCompleteConfirm = async () => {
    if (!completeModal) return
    await updateBooking(completeModal.bookingId, 'completed', completeNotes ? { session_notes: completeNotes } : undefined)
    setCompleteModal(null)
    setCompleteNotes('')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading your schedule...</p>
    </div>
  )

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const upcomingBookings = bookings
    .filter(b => ['requested', 'call_pending', 'call_complete', 'confirmed'].includes(b.status) && !isBefore(new Date(b.scheduled_at), new Date()))
    .slice(0, 5)

  const todayBookings = bookings.filter(b => isToday(new Date(b.scheduled_at)) && b.status !== 'cancelled')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <CounselorNav />

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
            <button onClick={() => { setView('week'); setListFilterDay(null) }} style={{
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
            <button onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); setListFilterDay(null) }} style={{
              padding: '4px 10px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
              backgroundColor: 'white', color: 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
            }}>Today</button>
          </div>
          {view === 'list' && listFilterDay && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>
                {format(listFilterDay, 'EEEE, MMMM d, yyyy')}
              </span>
              <button onClick={() => setListFilterDay(null)} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                backgroundColor: 'white', color: 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
              }}>Show All</button>
            </div>
          )}
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
                    return isSameDay(d, day) && d.getHours() === hour && b.status !== 'cancelled'
                  })
                  return (
                    <div key={day.toISOString()} style={{
                      borderLeft: '1px solid var(--nhlb-border)',
                      padding: 2, position: 'relative',
                      backgroundColor: isToday(day) ? 'rgba(184,49,31,0.03)' : 'transparent',
                      cursor: dayBookings.length ? 'pointer' : 'default',
                    }} onClick={() => dayBookings.length > 0 && goToListDay(day)}>
                      {dayBookings.map(b => {
                        const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.requested
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
        {view === 'list' && (() => {
          const listBookings = bookings.filter(b => {
            if (b.status === 'cancelled') return false
            const d = new Date(b.scheduled_at)
            if (listFilterDay) return isSameDay(d, listFilterDay)
            return d >= weekDays[0] && d <= addDays(weekDays[6], 1)
          })
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {listBookings.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
                {listFilterDay ? 'No sessions on this day' : 'No sessions this week'}
              </p>
            ) : (
              listBookings.map(b => {
                const isPreCallOpen = expandedPreCall === b.id
                const preCallVisible = ['call_pending', 'call_complete', 'confirmed', 'in_session', 'completed'].includes(b.status)
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
                            {b.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--nhlb-text)', margin: '0 0 2px' }}>
                          {b.client?.first_name} {b.client?.last_name}
                        </p>
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                          {b.type === 'VIRTUAL' ? '💻 Virtual' : '🏠 In Person'}
                          {' · '}{b.client?.service_type}
                          {b.client?.email ? <> · <a href={`mailto:${b.client.email}`} style={{ color: 'var(--nhlb-red)', textDecoration: 'none' }}>{b.client.email}</a></> : ''}
                          {b.client?.phone ? <> · <a href={`tel:${b.client.phone}`} style={{ color: 'var(--nhlb-red)', textDecoration: 'none' }}>{b.client.phone}</a></> : ''}
                        </p>
                        {b.type === 'VIRTUAL' && counselor?.zoom_link && (
                          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#1D4ED8', margin: '4px 0 0' }}>
                            <a href={counselor.zoom_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none' }}>
                              Start Zoom Meeting
                            </a>
                            {counselor.zoom_meeting_id && <> · ID: {counselor.zoom_meeting_id}</>}
                            {counselor.zoom_passcode && <> · Passcode: {counselor.zoom_passcode}</>}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => !isFutureSession(b.scheduled_at) && updateBooking(b.id, 'in_session')}
                            disabled={isFutureSession(b.scheduled_at)}
                            title={isFutureSession(b.scheduled_at) ? 'Session date must be today or in the past' : undefined}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none',
                              backgroundColor: '#3C3489', color: 'white',
                              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem',
                              cursor: isFutureSession(b.scheduled_at) ? 'not-allowed' : 'pointer',
                              opacity: isFutureSession(b.scheduled_at) ? 0.4 : 1,
                            }}>Start session</button>
                        )}
                        {b.status === 'in_session' && (
                          <button
                            onClick={() => {
                              if (isFutureSession(b.scheduled_at)) return
                              setCompleteModal({
                                bookingId: b.id,
                                name: `${b.client?.first_name ?? ''} ${b.client?.last_name ?? ''}`.trim() || 'Session',
                              })
                              setCompleteNotes('')
                            }}
                            disabled={isFutureSession(b.scheduled_at)}
                            title={isFutureSession(b.scheduled_at) ? 'Session date must be today or in the past' : undefined}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none',
                              backgroundColor: '#065F46', color: 'white',
                              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem',
                              cursor: isFutureSession(b.scheduled_at) ? 'not-allowed' : 'pointer',
                              opacity: isFutureSession(b.scheduled_at) ? 0.4 : 1,
                            }}>Complete session</button>
                        )}
                        {!['completed', 'cancelled'].includes(b.status) && (
                          <button onClick={() => updateBooking(b.id, 'cancelled')} style={{
                            padding: '6px 12px', borderRadius: 6, border: '1px solid #FECACA',
                            backgroundColor: 'white', color: '#DC2626',
                            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                          }}>Cancel</button>
                        )}
                        <a href={`/counselor/clients/${b.client_id}`} style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                          backgroundColor: 'white', color: 'var(--nhlb-muted)', textDecoration: 'none',
                          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem',
                          display: 'inline-flex', alignItems: 'center',
                        }}>View client</a>
                      </div>
                    </div>

                    {/* Pre-call notes */}
                    {preCallVisible && (
                      <div style={{ marginTop: 12 }}>
                        <button onClick={() => setExpandedPreCall(isPreCallOpen ? null : b.id)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                          color: '#633806', letterSpacing: '0.06em',
                        }}>
                          {isPreCallOpen ? '▾' : '▸'} PRE-CALL NOTES
                          {!!b.pre_call_notes && !isPreCallOpen && (
                            <span style={{ fontWeight: 400, marginLeft: 6, color: '#92400E' }}>(has notes)</span>
                          )}
                        </button>
                        {isPreCallOpen && (
                          <div style={{ marginTop: 6, padding: '12px 16px', backgroundColor: '#FAEEDA', borderRadius: 8 }}>
                            <textarea
                              value={localPreCallNotes[b.id] ?? (b.pre_call_notes ?? '')}
                              onChange={e => setLocalPreCallNotes(prev => ({ ...prev, [b.id]: e.target.value }))}
                              rows={2}
                              placeholder="Notes from the intake phone call..."
                              style={{ width: '100%', border: '1px solid #E3A008', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif', color: '#633806', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                            <button
                              onClick={() => savePreCallNotes(b.id)}
                              disabled={savingPreCall[b.id]}
                              style={{ marginTop: 6, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: '#633806', color: 'white', fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.72rem', opacity: savingPreCall[b.id] ? 0.6 : 1 }}>
                              {savingPreCall[b.id] ? 'Saving...' : 'Save pre-call notes'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Previous session notes for upcoming sessions */}
                    {['confirmed', 'in_session'].includes(b.status) && <PreviousNotes booking={b} />}

                    {/* Session notes accordion */}
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setExpandedSessionNotes(expandedSessionNotes === b.id ? null : b.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                        color: '#085041', letterSpacing: '0.06em',
                      }}>
                        {expandedSessionNotes === b.id ? '▾' : '▸'} SESSION NOTES
                        {!!b.session_note?.content && expandedSessionNotes !== b.id && (
                          <span style={{ fontWeight: 400, marginLeft: 6, color: '#065F46' }}>(has notes)</span>
                        )}
                      </button>
                      {expandedSessionNotes === b.id && (
                        <div style={{ marginTop: 6, padding: '12px 16px', backgroundColor: '#E1F5EE', borderRadius: 8 }}>
                          <textarea
                            value={localSessionNoteContent[b.id] ?? (b.session_note?.content ?? '')}
                            onChange={e => setLocalSessionNoteContent(prev => ({ ...prev, [b.id]: e.target.value }))}
                            rows={3}
                            placeholder="Session summary, goals discussed, homework assigned..."
                            style={{ width: '100%', border: '1px solid #34D399', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif', color: '#085041', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                          />
                          <button
                            onClick={() => saveSessionNote(b.id, b)}
                            disabled={savingSessionNote[b.id]}
                            style={{ marginTop: 6, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: '#085041', color: 'white', fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.72rem', opacity: savingSessionNote[b.id] ? 0.6 : 1 }}>
                            {savingSessionNote[b.id] ? 'Saving...' : 'Save session notes'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Private notes accordion */}
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setExpandedPrivateNotes(expandedPrivateNotes === b.id ? null : b.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                        color: '#4338CA', letterSpacing: '0.06em',
                      }}>
                        {expandedPrivateNotes === b.id ? '▾' : '▸'} PRIVATE NOTES
                        {!!b.session_note?.private_notes && expandedPrivateNotes !== b.id && (
                          <span style={{ fontWeight: 400, marginLeft: 6, color: '#6366F1' }}>(has notes)</span>
                        )}
                      </button>
                      {expandedPrivateNotes === b.id && (
                        <div style={{ marginTop: 6, padding: '12px 16px', backgroundColor: '#EEEDFE', borderRadius: 8 }}>
                          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', color: '#6366F1', margin: '0 0 6px', fontStyle: 'italic' }}>
                            Only you can see these notes
                          </p>
                          <textarea
                            value={localPrivateNotes[b.id] ?? (b.session_note?.private_notes ?? '')}
                            onChange={e => setLocalPrivateNotes(prev => ({ ...prev, [b.id]: e.target.value }))}
                            rows={2}
                            placeholder="Clinical observations, treatment plan notes..."
                            style={{ width: '100%', border: '1px solid #A5B4FC', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif', color: '#3730A3', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                          />
                          <button
                            onClick={() => savePrivateNote(b.id, b)}
                            disabled={savingPrivateNote[b.id]}
                            style={{ marginTop: 6, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: '#4338CA', color: 'white', fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.72rem', opacity: savingPrivateNote[b.id] ? 0.6 : 1 }}>
                            {savingPrivateNote[b.id] ? 'Saving...' : 'Save private notes'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          )})()}
      </div>

      {/* ── Complete Session Modal ── */}
      {completeModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={() => setCompleteModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: '32px', maxWidth: 460,
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px',
            }}>
              Complete Session
            </h3>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: '0 0 20px' }}>
              {completeModal.name} &mdash; Would you like to add session notes?
            </p>
            <textarea
              value={completeNotes}
              onChange={e => setCompleteNotes(e.target.value)}
              placeholder="Session notes (optional)"
              rows={4}
              style={{
                width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
                padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
                color: 'var(--nhlb-text)', background: 'white', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', marginBottom: 20,
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCompleteModal(null)} style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
                backgroundColor: 'white', color: 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleCompleteConfirm} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                backgroundColor: '#065F46', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}>
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
