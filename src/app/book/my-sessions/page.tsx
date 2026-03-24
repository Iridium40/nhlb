'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Booking, TimeSlot } from '@/types'

type Tab = 'current' | 'past'

const ACTIVE_STATUSES = ['requested', 'call_pending', 'call_complete', 'confirmed', 'in_session']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  requested: { bg: '#FEF3C7', text: '#92400E' },
  call_pending: { bg: '#FFF7ED', text: '#C2410C' },
  call_complete: { bg: '#EDE9FE', text: '#6D28D9' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  in_session: { bg: '#D1FAE5', text: '#065F46' },
  completed: { bg: '#F3F4F6', text: '#374151' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

export default function MySessionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<(Booking & { counselor?: { id: string; name: string; title: string; photo_url: string | null; zoom_link?: string; zoom_meeting_id?: string; zoom_passcode?: string } })[]>([])
  const [tab, setTab] = useState<Tab>('current')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/client/bookings')
        if (res.status === 401) { router.replace('/book'); return }
        const json = await res.json()
        setBookings(json.bookings ?? [])
      } catch {
        router.replace('/book')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const now = new Date()
  const currentBookings = bookings.filter(b =>
    new Date(b.scheduled_at) >= now && ACTIVE_STATUSES.includes(b.status)
  )
  const pastBookings = bookings.filter(b =>
    new Date(b.scheduled_at) < now || !ACTIVE_STATUSES.includes(b.status)
  )

  const canModify = (b: Booking) => {
    const hoursUntil = (new Date(b.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
    return hoursUntil >= 24 && ACTIVE_STATUSES.includes(b.status)
  }

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/booking/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
        setToast('Session cancelled successfully.')
        setTimeout(() => setToast(null), 3000)
      }
    } finally {
      setCancellingId(null)
    }
  }

  const loadRescheduleSlots = useCallback(async (counselorId: string) => {
    setLoadingSlots(true)
    const res = await fetch(`/api/booking/availability?newClient=false&counselorId=${counselorId}`)
    const json = await res.json()
    setSlots(json.slots ?? [])
    setLoadingSlots(false)
  }, [])

  const handleReschedule = async (bookingId: string, newScheduledAt: string) => {
    setRescheduling(true)
    try {
      const res = await fetch(`/api/booking/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_scheduled_at: newScheduledAt }),
      })
      const json = await res.json()
      if (res.ok) {
        const refreshRes = await fetch('/api/client/bookings')
        const refreshJson = await refreshRes.json()
        setBookings(refreshJson.bookings ?? [])
        setRescheduleId(null)
        setSlots([])
        setToast('Session rescheduled! Check your email for confirmation.')
        setTimeout(() => setToast(null), 4000)
      } else {
        setToast(json.error ?? 'Could not reschedule.')
        setTimeout(() => setToast(null), 4000)
      }
    } finally {
      setRescheduling(false)
    }
  }

  const groupedSlots = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const key = format(new Date(slot.start), 'EEE, MMM d')
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        My Sessions
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/book" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>&larr; Back</Link>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 0 20px',
          }}>My Sessions</h1>
        </div>
        <Link href="/book/donation-report" style={{
          padding: '6px 14px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
          backgroundColor: 'white', color: 'var(--nhlb-muted)', textDecoration: 'none',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          Donation Report
        </Link>
      </header>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#065F46', color: 'white', padding: '12px 24px',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.875rem',
          fontWeight: 600, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '2px solid var(--nhlb-border)' }}>
          {(['current', 'past'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setRescheduleId(null) }} style={{
              flex: 1, padding: '12px 16px', fontFamily: 'Lato, sans-serif',
              fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.04em',
              textTransform: 'capitalize', cursor: 'pointer',
              border: 'none', borderBottom: `3px solid ${tab === t ? 'var(--nhlb-red)' : 'transparent'}`,
              backgroundColor: 'transparent',
              color: tab === t ? 'var(--nhlb-red-dark)' : 'var(--nhlb-muted)',
              transition: 'all 0.15s',
            }}>
              {t === 'current' ? `Current (${currentBookings.length})` : `Past (${pastBookings.length})`}
            </button>
          ))}
        </div>

        {/* Current Tab */}
        {tab === 'current' && (
          <div>
            {currentBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 20 }}>
                  No upcoming sessions.
                </p>
                <Link href="/book/returning?auto=1" style={{
                  padding: '12px 24px', backgroundColor: 'var(--nhlb-red)', color: 'white',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                  borderRadius: 8, textDecoration: 'none',
                }}>
                  Book a Session
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {currentBookings.map(b => (
                  <SessionCard
                    key={b.id}
                    booking={b}
                    canModify={canModify(b)}
                    isCancelling={cancellingId === b.id}
                    isRescheduling={rescheduleId === b.id}
                    onCancel={() => handleCancel(b.id)}
                    onRescheduleToggle={() => {
                      if (rescheduleId === b.id) {
                        setRescheduleId(null)
                        setSlots([])
                      } else {
                        setRescheduleId(b.id)
                        loadRescheduleSlots(b.counselor_id)
                      }
                    }}
                    rescheduleSlots={rescheduleId === b.id ? groupedSlots : null}
                    loadingSlots={rescheduleId === b.id && loadingSlots}
                    rescheduling={rescheduling}
                    onSelectSlot={(slotStart) => handleReschedule(b.id, slotStart)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Past Tab */}
        {tab === 'past' && (
          <div>
            {pastBookings.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
                No past sessions.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pastBookings.map(b => (
                  <SessionCard key={b.id} booking={b} canModify={false} isPast />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionCard({
  booking: b,
  canModify,
  isPast,
  isCancelling,
  isRescheduling,
  onCancel,
  onRescheduleToggle,
  rescheduleSlots,
  loadingSlots,
  rescheduling,
  onSelectSlot,
}: {
  booking: Booking & { counselor?: { id: string; name: string; title: string; photo_url: string | null; zoom_link?: string; zoom_meeting_id?: string; zoom_passcode?: string } }
  canModify: boolean
  isPast?: boolean
  isCancelling?: boolean
  isRescheduling?: boolean
  onCancel?: () => void
  onRescheduleToggle?: () => void
  rescheduleSlots?: Record<string, TimeSlot[]> | null
  loadingSlots?: boolean
  rescheduling?: boolean
  onSelectSlot?: (slotStart: string) => void
}) {
  const scheduled = new Date(b.scheduled_at)
  const colors = STATUS_COLORS[b.status] ?? STATUS_COLORS.requested
  const hoursUntil = (scheduled.getTime() - Date.now()) / (1000 * 60 * 60)

  return (
    <div style={{
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 12, padding: '20px 24px', transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
            backgroundColor: '#F3F4F6', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--nhlb-border)',
          }}>
            {b.counselor?.photo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={b.counselor.photo_url} alt={b.counselor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div>
            <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--nhlb-red-dark)', margin: '0 0 2px' }}>
              {format(scheduled, 'EEEE, MMMM d, yyyy')}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: 0 }}>
              {format(scheduled, 'h:mm a')} &middot; {b.type === 'VIRTUAL' ? '💻 Virtual' : '🏠 In-person'}
              {b.counselor && <> &middot; {b.counselor.name}</>}
              {b.donation_amount_cents > 0 && <> &middot; ${(b.donation_amount_cents / 100).toFixed(2)} donation</>}
            </p>
          </div>
        </div>
        <span style={{
          display: 'inline-block', padding: '4px 10px', borderRadius: 6,
          fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'capitalize',
          backgroundColor: colors.bg, color: colors.text,
        }}>
          {b.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Virtual meeting details */}
      {b.type === 'VIRTUAL' && b.counselor?.zoom_link && !isPast && (
        <div style={{
          marginBottom: 12, padding: '10px 14px',
          backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
        }}>
          <a href={b.counselor.zoom_link} target="_blank" rel="noopener noreferrer" style={{ color: '#0369A1', fontWeight: 700 }}>
            Join Zoom Meeting
          </a>
          {b.counselor.zoom_meeting_id && (
            <span style={{ color: '#64748B', marginLeft: 12 }}>ID: {b.counselor.zoom_meeting_id}</span>
          )}
          {b.counselor.zoom_passcode && (
            <span style={{ color: '#64748B', marginLeft: 12 }}>Passcode: {b.counselor.zoom_passcode}</span>
          )}
        </div>
      )}

      {/* Actions for current sessions */}
      {!isPast && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canModify ? (
            <>
              <button onClick={onRescheduleToggle} style={{
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                backgroundColor: isRescheduling ? 'var(--nhlb-red)' : 'white',
                color: isRescheduling ? 'white' : 'var(--nhlb-red-dark)',
                border: `1px solid ${isRescheduling ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
              }}>
                {isRescheduling ? 'Cancel Reschedule' : 'Reschedule'}
              </button>
              <button onClick={onCancel} disabled={!!isCancelling} style={{
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                backgroundColor: 'white', color: '#B91C1C',
                border: '1px solid #FECACA',
                opacity: isCancelling ? 0.5 : 1,
              }}>
                {isCancelling ? 'Cancelling...' : 'Cancel Session'}
              </button>
            </>
          ) : !isPast && ACTIVE_STATUSES.includes(b.status) && hoursUntil < 24 ? (
            <p style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#92400E',
              margin: 0, padding: '8px 12px', backgroundColor: '#FEF3C7',
              borderRadius: 6, lineHeight: 1.5,
            }}>
              Within 24 hours — call <a href="tel:9852648808" style={{ fontWeight: 700, color: '#92400E' }}>985-264-8808</a> to cancel or reschedule.
            </p>
          ) : null}
        </div>
      )}

      {/* Reschedule slot picker */}
      {isRescheduling && rescheduleSlots && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--nhlb-border)' }}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--nhlb-red-dark)', marginBottom: 12 }}>
            Choose a new time:
          </p>
          {loadingSlots ? (
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.85rem' }}>Loading available times...</p>
          ) : Object.keys(rescheduleSlots).length === 0 ? (
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.85rem' }}>No available slots right now.</p>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {Object.entries(rescheduleSlots).map(([day, daySlots]) => (
                <div key={day} style={{ marginBottom: 16 }}>
                  <p style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--nhlb-muted)', marginBottom: 8,
                  }}>{day}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {daySlots.map(slot => (
                      <button key={slot.start} onClick={() => !rescheduling && onSelectSlot?.(slot.start)}
                        disabled={rescheduling}
                        style={{
                          padding: '8px 4px', border: '1px solid var(--nhlb-border)', borderRadius: 6,
                          backgroundColor: 'white', fontFamily: 'Lato, sans-serif',
                          fontSize: '0.75rem', color: 'var(--nhlb-text)', cursor: rescheduling ? 'wait' : 'pointer',
                          transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--nhlb-red)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--nhlb-red)' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--nhlb-text)'; e.currentTarget.style.borderColor = 'var(--nhlb-border)' }}>
                        {format(new Date(slot.start), 'h:mm a')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
