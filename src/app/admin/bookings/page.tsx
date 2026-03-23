'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  format, startOfWeek, addDays, isSameDay, isToday,
} from 'date-fns'
import type { Booking, BookingStatus } from '@/types'
import { STATUS_TRANSITIONS } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  requested:     { bg: '#F1EFE8', text: '#5F5E5A' },
  call_pending:  { bg: '#FAEEDA', text: '#633806' },
  call_complete: { bg: '#E6F1FB', text: '#0C447C' },
  confirmed:     { bg: '#E1F5EE', text: '#085041' },
  in_session:    { bg: '#EEEDFE', text: '#3C3489' },
  completed:     { bg: '#EAF3DE', text: '#27500A' },
  cancelled:     { bg: '#FCEBEB', text: '#791F1F' },
}

const ACTION_LABELS: Record<string, string> = {
  call_pending:  'Begin intake call',
  call_complete: 'Mark call complete',
  confirmed:     'Confirm session',
  in_session:    'Start session',
  completed:     'Complete session',
  cancelled:     'Cancel',
}

const COUNSELOR_COLORS = [
  { border: 'var(--nhlb-red)', bg: '#FDF2F2' },
  { border: '#1D4ED8', bg: '#EFF6FF' },
  { border: '#7C3AED', bg: '#F5F3FF' },
  { border: '#059669', bg: '#ECFDF5' },
  { border: '#D97706', bg: '#FFFBEB' },
]

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7)

type ViewMode = 'list' | 'week'

const ALL_STATUSES: BookingStatus[] = ['requested', 'call_pending', 'call_complete', 'confirmed', 'in_session', 'completed', 'cancelled']

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | BookingStatus>('all')
  const [counselorFilter, setCounselorFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [listFilterDay, setListFilterDay] = useState<Date | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({})
  const [localPreCallNotes, setLocalPreCallNotes] = useState<Record<string, string>>({})
  const [localSessionNotes, setLocalSessionNotes] = useState<Record<string, string>>({})
  const [expandedPreCall, setExpandedPreCall] = useState<string | null>(null)
  const [expandedSessionNotes, setExpandedSessionNotes] = useState<string | null>(null)
  const [completeModal, setCompleteModal] = useState<{ bookingId: string; name: string } | null>(null)
  const [completeNotes, setCompleteNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/booking/availability?admin=true&status=${filter}`)
    if (!res.ok) { setLoading(false); return }
    const json = await res.json()
    setBookings(json.bookings ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const transition = async (bookingId: string, newStatus: string, extra?: Record<string, unknown>) => {
    const res = await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...extra }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      showToast(json.error ?? 'Failed to update status')
      return
    }
    const booking = bookings.find(b => b.id === bookingId)
    const name = booking?.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Session'
    showToast(`${name} → ${newStatus.replace('_', ' ')}`)
    load()
  }

  const saveNotes = async (bookingId: string, field: 'pre_call_notes' | 'session_notes') => {
    setSavingNotes(prev => ({ ...prev, [`${bookingId}_${field}`]: true }))
    const value = field === 'pre_call_notes' ? localPreCallNotes[bookingId] : localSessionNotes[bookingId]
    await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setSavingNotes(prev => ({ ...prev, [`${bookingId}_${field}`]: false }))
    showToast('Notes saved')
    load()
  }

  const filters: ('all' | BookingStatus)[] = ['all', ...ALL_STATUSES]
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const views: { key: ViewMode; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'list', label: 'List' },
  ]

  const counselorNames = [...new Set(bookings.map(b => b.counselor?.name).filter(Boolean))]
  const counselorColorMap: Record<string, typeof COUNSELOR_COLORS[0]> = {}
  counselorNames.forEach((name, i) => {
    if (name) counselorColorMap[name] = COUNSELOR_COLORS[i % COUNSELOR_COLORS.length]
  })

  const matchesFilters = (b: Booking) =>
    (filter === 'all' || b.status === filter)
    && (counselorFilter === 'all' || b.counselor?.name === counselorFilter)

  const goToListDay = (day: Date) => {
    setListFilterDay(day)
    setView('list')
  }

  const visibleBookings = bookings.filter(b => {
    if (!matchesFilters(b)) return false
    const d = new Date(b.scheduled_at)
    if (listFilterDay) return isSameDay(d, listFilterDay)
    return d >= weekDays[0] && d <= addDays(weekDays[6], 1)
  })

  const callPendingCount = bookings.filter(b => b.status === 'call_pending').length

  const nextActions = (status: string): string[] => STATUS_TRANSITIONS[status] ?? []

  const statusIdx = (s: string) => ALL_STATUSES.indexOf(s as BookingStatus)

  const isFutureSession = (scheduledAt: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const schedDay = new Date(scheduledAt)
    schedDay.setHours(0, 0, 0, 0)
    return schedDay > today
  }

  const handleCompleteConfirm = async () => {
    if (!completeModal) return
    await transition(completeModal.bookingId, 'completed', completeNotes ? { session_notes: completeNotes } : undefined)
    setCompleteModal(null)
    setCompleteNotes('')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      {/* Alert banner for call_pending */}
      {callPendingCount > 0 && (
        <div style={{
          backgroundColor: '#FAEEDA', borderBottom: '2px solid #E3A008', padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: '1.1rem' }}>📞</span>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#633806' }}>
            {callPendingCount} session{callPendingCount !== 1 ? 's' : ''} awaiting intake call
          </span>
        </div>
      )}

      <div style={{ maxWidth: view === 'list' ? 900 : 1100, margin: '0 auto', padding: '32px 24px', transition: 'max-width 0.2s' }}>

        {/* Toolbar: filters + view toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filters.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  padding: '6px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: filter === s ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                  backgroundColor: filter === s ? 'var(--nhlb-red)' : 'white',
                  color: filter === s ? 'white' : 'var(--nhlb-muted)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.03em', textTransform: 'capitalize', cursor: 'pointer',
                }}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
            {counselorNames.length > 1 && (
              <select
                value={counselorFilter}
                onChange={e => setCounselorFilter(e.target.value)}
                style={{
                  padding: '6px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: counselorFilter !== 'all' ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                  backgroundColor: counselorFilter !== 'all' ? 'var(--nhlb-red)' : 'white',
                  color: counselorFilter !== 'all' ? 'white' : 'var(--nhlb-muted)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
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
              <button key={v.key} onClick={() => { setView(v.key); if (v.key === 'week') setListFilterDay(null) }} style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid',
                borderColor: view === v.key ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                backgroundColor: view === v.key ? 'var(--nhlb-red)' : 'white',
                color: view === v.key ? 'white' : 'var(--nhlb-muted)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* Week nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)' }}>&larr;</button>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-text)', minWidth: 180, textAlign: 'center' }}>
              {format(weekStart, 'MMM d')} &ndash; {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--nhlb-muted)' }}>&rarr;</button>
            <button onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); setListFilterDay(null) }} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)', backgroundColor: 'white', color: 'var(--nhlb-muted)', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Today</button>
          </div>
          {view === 'week' && <CounselorLegend names={counselorNames} colorMap={counselorColorMap} />}
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

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading sessions...
          </p>
        ) : (
          <>
            {/* ── Week View ── */}
            {view === 'week' && (
              <div style={{ background: 'white', border: '1px solid var(--nhlb-border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--nhlb-border)' }}>
                  <div style={{ padding: 8 }} />
                  {weekDays.map(day => (
                    <div key={day.toISOString()} style={{
                      padding: '10px 8px', textAlign: 'center',
                      backgroundColor: isToday(day) ? 'var(--nhlb-red)' : 'var(--nhlb-cream-dark)',
                      color: isToday(day) ? 'white' : 'var(--nhlb-text)',
                      borderLeft: '1px solid var(--nhlb-border)',
                    }}>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', margin: 0 }}>{format(day, 'EEE').toUpperCase()}</p>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{format(day, 'd')}</p>
                    </div>
                  ))}
                </div>
                {HOURS.map(hour => (
                  <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: 60, borderBottom: '1px solid var(--nhlb-border)' }}>
                    <div style={{ padding: '4px 8px', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', textAlign: 'right', borderRight: '1px solid var(--nhlb-border)' }}>
                      {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
                    </div>
                    {weekDays.map(day => {
                      const dayBookings = bookings.filter(b => {
                        const d = new Date(b.scheduled_at)
                        return isSameDay(d, day) && d.getHours() === hour && matchesFilters(b)
                      })
                      return (
                        <div key={day.toISOString()} style={{ borderLeft: '1px solid var(--nhlb-border)', padding: 2, backgroundColor: isToday(day) ? 'rgba(184,49,31,0.03)' : 'transparent', cursor: dayBookings.length ? 'pointer' : 'default' }}
                          onClick={() => dayBookings.length > 0 && goToListDay(day)}>
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

            {/* ── List View ── */}
            {view === 'list' && (
              visibleBookings.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>No sessions found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visibleBookings.map(b => {
                    const ss = STATUS_STYLES[b.status] ?? STATUS_STYLES.requested
                    const actions = nextActions(b.status)
                    const preCallVisible = statusIdx(b.status) >= statusIdx('call_pending')
                    const sessionNotesVisible = statusIdx(b.status) >= statusIdx('confirmed')
                    const phone = b.client?.phone
                    const isPreCallOpen = expandedPreCall === b.id
                    const isSessionNotesOpen = expandedSessionNotes === b.id

                    return (
                      <div key={b.id} style={{
                        background: 'white', border: '1px solid var(--nhlb-border)',
                        borderRadius: 10, padding: '16px 20px',
                        borderLeft: `4px solid ${b.type === 'VIRTUAL' ? '#3B82F6' : 'var(--nhlb-red)'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--nhlb-red-dark)' }}>
                                {format(new Date(b.scheduled_at), 'EEE, MMM d')} at {format(new Date(b.scheduled_at), 'h:mm a')}
                              </span>
                              <span style={{
                                backgroundColor: ss.bg, color: ss.text,
                                padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
                                fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
                              }}>
                                {b.status.replace('_', ' ')}
                              </span>
                              {b.is_recurring && (
                                <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>
                                  ↻ Recurring
                                </span>
                              )}
                              {b.series_index > 1 && (
                                <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>
                                  Session #{b.series_index}
                                </span>
                              )}
                            </div>
                            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--nhlb-text)', margin: '0 0 2px' }}>
                              {b.client?.first_name} {b.client?.last_name}
                            </p>
                            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                              {b.type === 'VIRTUAL' ? '💻 Virtual' : '🏠 In Person'}
                              {' · '}{b.client?.service_type}
                              {b.counselor?.name ? ` · ${b.counselor.name}` : ''}
                              {b.client?.email ? <> · <a href={`mailto:${b.client.email}`} style={{ color: 'var(--nhlb-red)', textDecoration: 'none' }}>{b.client.email}</a></> : ''}
                              {phone ? <> · <a href={`tel:${phone}`} style={{ color: 'var(--nhlb-red)', textDecoration: 'none' }}>{phone}</a></> : ''}
                              {b.donation_amount_cents > 0 ? ` · $${(b.donation_amount_cents / 100).toFixed(2)} donation` : ''}
                            </p>
                            {b.type === 'VIRTUAL' && b.counselor?.zoom_link && (
                              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#1D4ED8', margin: '4px 0 0' }}>
                                <a href={b.counselor.zoom_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none' }}>Join Zoom</a>
                                {b.counselor.zoom_meeting_id && <> · ID: {b.counselor.zoom_meeting_id}</>}
                                {b.counselor.zoom_passcode && <> · Passcode: {b.counselor.zoom_passcode}</>}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {actions.filter(a => a !== 'cancelled').map(a => {
                              const futureBlock = (a === 'in_session' || a === 'completed') && isFutureSession(b.scheduled_at)
                              return (
                                <button key={a}
                                  onClick={() => {
                                    if (futureBlock) return
                                    if (a === 'completed') {
                                      setCompleteModal({ bookingId: b.id, name: `${b.client?.first_name ?? ''} ${b.client?.last_name ?? ''}`.trim() || 'Session' })
                                      setCompleteNotes(localSessionNotes[b.id] ?? b.session_notes ?? '')
                                    } else {
                                      transition(b.id, a)
                                    }
                                  }}
                                  disabled={futureBlock}
                                  title={futureBlock ? 'Session date must be today or in the past' : undefined}
                                  style={{
                                    padding: '6px 12px', borderRadius: 6, border: 'none',
                                    cursor: futureBlock ? 'not-allowed' : 'pointer',
                                    backgroundColor: STATUS_STYLES[a]?.bg ?? '#F3F4F6',
                                    color: STATUS_STYLES[a]?.text ?? '#374151',
                                    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem',
                                    opacity: futureBlock ? 0.4 : 1,
                                  }}>
                                  {ACTION_LABELS[a] ?? a}
                                </button>
                              )
                            })}
                            {actions.includes('cancelled') && (
                              <button onClick={() => transition(b.id, 'cancelled')}
                                style={{
                                  padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                  border: '1px solid #FECACA', backgroundColor: 'white', color: '#DC2626',
                                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.7rem',
                                }}>
                                Cancel
                              </button>
                            )}
                            <a href={`/admin/bookings/clients/${b.client_id}`} style={{
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
                                  value={localPreCallNotes[b.id] ?? b.pre_call_notes ?? ''}
                                  onChange={e => setLocalPreCallNotes(prev => ({ ...prev, [b.id]: e.target.value }))}
                                  rows={2}
                                  placeholder="Notes from the intake phone call..."
                                  style={{ width: '100%', border: '1px solid #E3A008', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif', color: '#633806', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                />
                                <button
                                  onClick={() => saveNotes(b.id, 'pre_call_notes')}
                                  disabled={savingNotes[`${b.id}_pre_call_notes`]}
                                  style={{ marginTop: 6, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: '#633806', color: 'white', fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.72rem', opacity: savingNotes[`${b.id}_pre_call_notes`] ? 0.6 : 1 }}>
                                  {savingNotes[`${b.id}_pre_call_notes`] ? 'Saving...' : 'Save pre-call notes'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Session notes */}
                        {sessionNotesVisible && (
                          <div style={{ marginTop: 8 }}>
                            <button onClick={() => setExpandedSessionNotes(isSessionNotesOpen ? null : b.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                              color: '#085041', letterSpacing: '0.06em',
                            }}>
                              {isSessionNotesOpen ? '▾' : '▸'} SESSION NOTES
                              {!!b.session_notes && !isSessionNotesOpen && (
                                <span style={{ fontWeight: 400, marginLeft: 6, color: '#065F46' }}>(has notes)</span>
                              )}
                            </button>
                            {isSessionNotesOpen && (
                              <div style={{ marginTop: 6, padding: '12px 16px', backgroundColor: '#E1F5EE', borderRadius: 8 }}>
                                <textarea
                                  value={localSessionNotes[b.id] ?? b.session_notes ?? ''}
                                  onChange={e => setLocalSessionNotes(prev => ({ ...prev, [b.id]: e.target.value }))}
                                  rows={2}
                                  placeholder="Summary of the session, progress, follow-up..."
                                  style={{ width: '100%', border: '1px solid #34D399', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif', color: '#085041', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                                />
                                <button
                                  onClick={() => saveNotes(b.id, 'session_notes')}
                                  disabled={savingNotes[`${b.id}_session_notes`]}
                                  style={{ marginTop: 6, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: '#085041', color: 'white', fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.72rem', opacity: savingNotes[`${b.id}_session_notes`] ? 0.6 : 1 }}>
                                  {savingNotes[`${b.id}_session_notes`] ? 'Saving...' : 'Save session notes'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </>
        )}
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

      {/* ── Success Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#065F46', color: 'white', padding: '14px 28px',
          borderRadius: 12, fontFamily: 'Lato, sans-serif', fontSize: '0.875rem',
          fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.18)', zIndex: 10000,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeInUp 0.25s ease-out',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  )
}

function BookingChip({ booking: b, colorMap }: {
  booking: Booking
  colorMap: Record<string, typeof COUNSELOR_COLORS[0]>
}) {
  const cName = b.counselor?.name ?? ''
  const cc = colorMap[cName] ?? COUNSELOR_COLORS[0]
  const cancelled = b.status === 'cancelled'
  return (
    <div style={{
      display: 'block',
      backgroundColor: cancelled ? '#FCEBEB' : cc.bg,
      borderRadius: 4, padding: '3px 6px', marginBottom: 2,
      borderLeft: `3px solid ${cancelled ? '#DC2626' : cc.border}`,
      opacity: cancelled ? 0.5 : 1,
    }}>
      <span style={{
        fontFamily: 'Lato, sans-serif', fontWeight: 700,
        fontSize: '0.68rem', color: 'var(--nhlb-text)',
        lineHeight: 1.3, display: 'block',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {b.client?.first_name} {b.client?.last_name?.[0]}.
      </span>
      <span style={{
        fontFamily: 'Lato, sans-serif', fontSize: '0.58rem',
        color: 'var(--nhlb-muted)', lineHeight: 1.2, display: 'block',
      }}>
        {cName.split(' ')[0]}
        {b.type === 'VIRTUAL' ? ' · Virtual' : ''}
      </span>
    </div>
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
