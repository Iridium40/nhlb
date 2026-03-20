'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import type { Booking } from '@/types'

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  pending:   { backgroundColor: '#FEF3C7', color: '#92400E' },
  confirmed: { backgroundColor: '#D1FAE5', color: '#065F46' },
  cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  completed: { backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)' },
}

function ZoomPanel({ booking, onSaved }: { booking: Booking; onSaved: (updated: Booking) => void }) {
  const [link, setLink]           = useState(booking.meeting_link ?? '')
  const [meetingId, setMeetingId] = useState(booking.meeting_id ?? '')
  const [passcode, setPasscode]   = useState(booking.meeting_passcode ?? '')
  const [saving, setSaving]       = useState(false)
  const [sending, setSending]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const isDirty =
    link     !== (booking.meeting_link    ?? '') ||
    meetingId !== (booking.meeting_id      ?? '') ||
    passcode !== (booking.meeting_passcode ?? '')

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          meeting_link: link.trim() || null,
          meeting_id: meetingId.trim() || null,
          meeting_passcode: passcode.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      onSaved(json.booking)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async () => {
    if (!link.trim()) { setError('Save a meeting link first'); return }
    setSending(true)
    setError(null)
    setEmailSent(false)
    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 4000)
    } finally {
      setSending(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%',
    border: '1px solid var(--nhlb-border)',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: '0.8rem',
    fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)',
    background: 'white',
    outline: 'none',
  }

  return (
    <div style={{
      marginTop: 14,
      padding: '16px 18px',
      backgroundColor: '#EFF6FF',
      border: '1px solid #BFDBFE',
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: '1rem' }}>💻</span>
        <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#1D4ED8', margin: 0, letterSpacing: '0.04em' }}>
          VIRTUAL SESSION &mdash; ZOOM DETAILS
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{
            display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
            fontWeight: 700, letterSpacing: '0.06em', color: '#1E40AF', marginBottom: 4,
          }}>
            ZOOM LINK *
          </label>
          <input type="url" value={link} onChange={e => setLink(e.target.value)} style={inp} placeholder="https://zoom.us/j/..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{
              display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.06em', color: '#1E40AF', marginBottom: 4,
            }}>
              MEETING ID
            </label>
            <input type="text" value={meetingId} onChange={e => setMeetingId(e.target.value)} style={inp} placeholder="123 456 7890" />
          </div>
          <div>
            <label style={{
              display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.06em', color: '#1E40AF', marginBottom: 4,
            }}>
              PASSCODE
            </label>
            <input type="text" value={passcode} onChange={e => setPasscode(e.target.value)} style={inp} placeholder="abc123" />
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#DC2626', marginBottom: 10 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            padding: '8px 16px', borderRadius: 6, border: 'none',
            cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
            backgroundColor: isDirty ? '#1D4ED8' : '#93C5FD',
            color: 'white', fontFamily: 'Lato, sans-serif',
            fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em',
            opacity: saving ? 0.7 : 1, transition: 'all 0.12s',
          }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save details'}
        </button>

        <button
          onClick={handleSendEmail}
          disabled={sending || !link.trim() || isDirty}
          style={{
            padding: '8px 16px', borderRadius: 6, border: '1px solid #BFDBFE',
            cursor: sending || !link.trim() || isDirty ? 'not-allowed' : 'pointer',
            backgroundColor: 'white', color: emailSent ? '#059669' : '#1D4ED8',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
            letterSpacing: '0.04em', opacity: sending || isDirty ? 0.5 : 1, transition: 'all 0.12s',
          }}
        >
          {sending ? 'Sending...' : emailSent ? '✓ Email sent to client' : '✉️ Send link to client'}
        </button>

        {isDirty && (
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: '#6B7280', fontStyle: 'italic' }}>
            Save first before sending
          </span>
        )}

        {booking.meeting_link && !isDirty && (
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: '#059669' }}>
            ✓ Link on file
          </span>
        )}
      </div>

      {booking.client && (
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
          color: '#6B7280', marginTop: 10, marginBottom: 0,
        }}>
          Will be sent to: <strong>{booking.client.email}</strong>
        </p>
      )}
    </div>
  )
}

function BookingCard({ booking: initialBooking, onUpdate }: {
  booking: Booking
  onUpdate: (id: string, status: string) => void
}) {
  const [booking, setBooking] = useState(initialBooking)

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--nhlb-border)',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600,
              color: 'var(--nhlb-red-dark)', margin: 0,
            }}>
              {booking.client?.first_name} {booking.client?.last_name}
            </p>
            <span style={{
              ...STATUS_STYLES[booking.status],
              padding: '3px 10px', borderRadius: 20,
              fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Lato, sans-serif',
              letterSpacing: '0.04em', textTransform: 'capitalize',
            }}>
              {booking.status}
            </span>
            <span style={{
              backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)',
              padding: '3px 10px', borderRadius: 20,
              fontSize: '0.7rem', fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
            }}>
              {booking.client?.service_type}
            </span>
            <span style={{
              backgroundColor: booking.session_format === 'virtual' ? '#EFF6FF' : 'var(--nhlb-cream-dark)',
              color: booking.session_format === 'virtual' ? '#1D4ED8' : 'var(--nhlb-muted)',
              border: `1px solid ${booking.session_format === 'virtual' ? '#BFDBFE' : 'var(--nhlb-blush-light)'}`,
              padding: '3px 10px', borderRadius: 20,
              fontSize: '0.7rem', fontFamily: 'Lato, sans-serif',
            }}>
              {booking.session_format === 'virtual' ? '💻 Virtual' : '🏠 In Person'}
            </span>
            {booking.session_format === 'virtual' && booking.meeting_link && (
              <span style={{
                backgroundColor: '#D1FAE5', color: '#065F46',
                padding: '3px 10px', borderRadius: 20,
                fontSize: '0.7rem', fontFamily: 'Lato, sans-serif',
              }}>
                ✓ Zoom set
              </span>
            )}
            {booking.session_format === 'virtual' && !booking.meeting_link && (
              <span style={{
                backgroundColor: '#FEF3C7', color: '#92400E',
                padding: '3px 10px', borderRadius: 20,
                fontSize: '0.7rem', fontFamily: 'Lato, sans-serif',
              }}>
                ⚠ No Zoom link
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)' }}>
              📅 {format(new Date(booking.scheduled_at), 'EEE, MMM d')} at {format(new Date(booking.scheduled_at), 'h:mm a')}
            </span>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)' }}>
              👤 {booking.counselor?.name}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
              {booking.client?.email}
            </span>
            {booking.client?.phone && (
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
                {booking.client.phone}
              </span>
            )}
          </div>

          {booking.client?.brief_reason && (
            <div style={{
              marginTop: 12, padding: '12px 16px',
              backgroundColor: 'var(--nhlb-cream-dark)',
              borderRadius: 8, borderLeft: '3px solid var(--nhlb-blush)',
            }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: '1rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.5,
              }}>
                &ldquo;{booking.client.brief_reason}&rdquo;
              </p>
            </div>
          )}

          {booking.session_format === 'virtual' && (
            <ZoomPanel booking={booking} onSaved={setBooking} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {booking.status === 'pending' && (
            <button onClick={() => onUpdate(booking.id, 'confirmed')}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: '#059669', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              }}>
              Confirm
            </button>
          )}
          {booking.status === 'confirmed' && (
            <button onClick={() => onUpdate(booking.id, 'completed')}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: 'var(--nhlb-muted)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              }}>
              Mark complete
            </button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <button onClick={() => onUpdate(booking.id, 'cancelled')}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #FECACA', backgroundColor: 'white', color: '#DC2626',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ status, count }: { status: string; count: number }) {
  const colors: Record<string, string> = {
    pending: 'var(--nhlb-red)',
    confirmed: '#059669',
    completed: 'var(--nhlb-muted)',
    cancelled: '#DC2626',
  }
  return (
    <div style={{
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 10, padding: '16px 20px',
    }}>
      <p style={{
        fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'capitalize',
        color: 'var(--nhlb-muted)', margin: '0 0 6px',
      }}>{status}</p>
      <p style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600,
        color: colors[status] ?? 'var(--nhlb-text)', margin: 0, lineHeight: 1,
      }}>{count}</p>
    </div>
  )
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin?status=${filter}`)
    const json = await res.json()
    setBookings(json.bookings ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const updateStatus = async (bookingId: string, status: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status }),
    })
    fetchBookings()
  }

  const filters = ['all', 'pending', 'confirmed', 'completed'] as const

  const needsZoom = bookings.filter(
    b => b.session_format === 'virtual' && !b.meeting_link &&
    b.status !== 'cancelled' && b.status !== 'completed'
  ).length

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
        justifyContent: 'space-between', height: 72,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
            alt="No Heart Left Behind" style={{ height: 44, width: 'auto' }}
          />
          <div style={{ borderLeft: '1px solid var(--nhlb-blush-light)', paddingLeft: 16 }}>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem',
              color: 'var(--nhlb-red-dark)', margin: 0, fontWeight: 600,
            }}>Counseling Sessions</p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: 0 }}>
              430 N. Jefferson Ave, Covington, LA
            </p>
          </div>
        </div>

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
              {s}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {needsZoom > 0 && (
          <div style={{
            marginBottom: 24, padding: '14px 18px',
            backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: '#92400E', margin: 0 }}>
              <strong>{needsZoom} virtual {needsZoom === 1 ? 'session' : 'sessions'}</strong> still need a Zoom link. Scroll down to add them.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
            <StatCard key={s} status={s} count={bookings.filter(b => b.status === s).length} />
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading sessions...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--nhlb-muted)' }}>
              No sessions found
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} onUpdate={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
