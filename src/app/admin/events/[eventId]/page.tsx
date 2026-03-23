'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Event, EventRegistration } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

export default function EventAttendeesPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [regs, setRegs] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState(
    'This event has been cancelled.'
  )
  const [cancelling, setCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState<{ refundsIssued: number; refundsFailed: number } | null>(null)

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

  const handleCancel = async () => {
    setCancelling(true)
    const res = await fetch(`/api/events/${eventId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: cancelReason }),
    })
    const json = await res.json()
    setCancelling(false)
    if (res.ok) {
      setCancelResult({ refundsIssued: json.refundsIssued, refundsFailed: json.refundsFailed })
      load()
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  const confirmed = regs.filter(r => r.status === 'confirmed')
  const pending = regs.filter(r => r.status === 'pending')
  const active = [...confirmed, ...pending]
  const refunded = regs.filter(r => r.status === 'refunded')
  const totalRevenue = active.reduce((s, r) => s + r.amount_paid_cents, 0)
  const isCancelled = !!event?.cancelled_at

  const minCap = event?.min_capacity ?? 0
  const maxCap = event?.max_capacity ?? 0
  const regCount = active.length
  const pct = maxCap > 0 ? Math.min((regCount / maxCap) * 100, 100) : 0
  const barColor = minCap > 0 && regCount < minCap ? '#DC2626'
    : pct >= 75 ? '#059669'
    : '#D97706'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <button onClick={() => router.push('/admin/events')} style={{
              background: 'none', border: 'none', fontFamily: 'Lato, sans-serif',
              fontSize: '0.8rem', color: 'var(--nhlb-muted)', cursor: 'pointer', padding: 0, marginBottom: 8,
            }}>&larr; Back to Events</button>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
            }}>{event?.title}</h2>
            {isCancelled && (
              <span style={{
                display: 'inline-block', marginTop: 6, padding: '4px 10px',
                backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 6,
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280',
              }}>CANCELLED</span>
            )}
          </div>
          <a href={`/api/events/${eventId}/registrations/export`} style={{
            padding: '8px 18px', borderRadius: 8,
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            textDecoration: 'none',
          }}>
            Export CSV
          </a>
        </div>

        {/* Attendance meter */}
        {(minCap > 0 || maxCap > 0) && (
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--nhlb-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Attendance
              </span>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--nhlb-text)' }}>
                {regCount}{minCap > 0 ? ` / ${minCap} min` : ''}{maxCap > 0 ? ` / ${maxCap} max` : ''}
              </span>
            </div>
            <div style={{ height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              {minCap > 0 && maxCap > 0 && (
                <div style={{
                  position: 'absolute', left: `${(minCap / maxCap) * 100}%`, top: 0, bottom: 0,
                  width: 2, backgroundColor: '#9CA3AF', zIndex: 2,
                }} />
              )}
              <div style={{
                height: '100%', width: `${pct}%`, backgroundColor: barColor,
                borderRadius: 5, transition: 'width 0.3s',
              }} />
            </div>
            {minCap > 0 && regCount < minCap && !isCancelled && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#DC2626', marginTop: 8, marginBottom: 0 }}>
                {minCap - regCount} more needed to meet minimum
                {event?.cancellation_deadline && (
                  <> by {format(new Date(event.cancellation_deadline), 'MMM d, h:mm a')}</>
                )}
              </p>
            )}
            {minCap > 0 && regCount >= minCap && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#059669', marginTop: 8, marginBottom: 0 }}>
                Minimum met
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
              {confirmed.length}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
              Confirmed
            </p>
          </div>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: '#D97706', margin: 0 }}>
              {pending.length}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
              Pending
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
        {active.length === 0 && refunded.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
            No registrations yet
          </p>
        ) : (
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, overflow: 'hidden', marginBottom: 32,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--nhlb-cream-dark)' }}>
                  {['Name', 'Email', 'Phone', 'Status', 'Paid', 'Registered'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.06em', color: 'var(--nhlb-muted)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regs.map((r, i) => {
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    confirmed: { bg: '#E1F5EE', text: '#065F46' },
                    pending: { bg: '#FEF3C7', text: '#92400E' },
                    cancelled: { bg: '#F3F4F6', text: '#6B7280' },
                    refunded: { bg: '#EDE9FE', text: '#5B21B6' },
                  }
                  const sc = statusColors[r.status] ?? { bg: '#F3F4F6', text: '#6B7280' }
                  return (
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
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          backgroundColor: sc.bg, color: sc.text,
                          fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                          textTransform: 'capitalize',
                        }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)' }}>
                        {r.amount_paid_cents > 0 ? `$${(r.amount_paid_cents / 100).toFixed(2)}` : 'Free'}
                        {r.refund_amount_cents ? (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#5B21B6' }}>
                            Refunded ${(r.refund_amount_cents / 100).toFixed(2)}
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
                        {format(new Date(r.created_at), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Cancel event — danger zone */}
        {!isCancelled && (
          <div style={{
            background: 'white', border: '2px solid #FECACA',
            borderRadius: 12, padding: '24px', marginBottom: 32,
          }}>
            <h3 style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: '#B91C1C', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Danger Zone
            </h3>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', marginBottom: 16 }}>
              Cancelling will refund all paid registrations and email every registrant.
            </p>
            <button onClick={() => setShowCancelModal(true)} style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #DC2626',
              backgroundColor: 'white', color: '#DC2626',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}>
              Cancel This Event
            </button>
          </div>
        )}

        {/* Cancelled info */}
        {isCancelled && event && (
          <div style={{
            background: '#F9FAFB', border: '1px solid #D1D5DB',
            borderRadius: 12, padding: '20px', marginBottom: 32,
          }}>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', margin: '0 0 6px' }}>
              Cancelled {format(new Date(event.cancelled_at!), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
            {event.cancellation_reason && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#4B5563', margin: 0, fontStyle: 'italic' }}>
                &ldquo;{event.cancellation_reason}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => !cancelling && setShowCancelModal(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '32px',
            maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            {cancelResult ? (
              <>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--nhlb-red-dark)', margin: '0 0 12px' }}>
                  Event Cancelled
                </h3>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', marginBottom: 8 }}>
                  Refunds issued: {cancelResult.refundsIssued}
                </p>
                {cancelResult.refundsFailed > 0 && (
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: '#DC2626', marginBottom: 8 }}>
                    Refunds failed: {cancelResult.refundsFailed} (manual action required in Stripe)
                  </p>
                )}
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', marginBottom: 20 }}>
                  All registrants have been emailed. A summary has been sent to the admin.
                </p>
                <button onClick={() => { setShowCancelModal(false); setCancelResult(null) }} style={{
                  width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                  backgroundColor: 'var(--nhlb-red)', color: 'white',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                }}>
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#B91C1C', margin: '0 0 12px' }}>
                  Cancel this event?
                </h3>
                <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px' }}>This will:</p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Cancel all {active.length} active registrations</li>
                    {totalRevenue > 0 && <li>Issue full refunds totalling ${(totalRevenue / 100).toFixed(2)}</li>}
                    <li>Send cancellation emails to all registrants</li>
                    <li>Unpublish the event page immediately</li>
                  </ul>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
                    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--nhlb-muted)', marginBottom: 6,
                  }}>Cancellation reason (shown to registrants)</label>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
                      padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
                      color: 'var(--nhlb-text)', resize: 'none', outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 8, border: 'none',
                      backgroundColor: '#DC2626', color: 'white',
                      fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                      cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.6 : 1,
                    }}
                  >
                    {cancelling ? 'Cancelling & Refunding...' : 'Cancel Event & Issue Refunds'}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                    style={{
                      padding: '12px 20px', borderRadius: 8,
                      border: '1px solid var(--nhlb-border)', backgroundColor: 'white',
                      color: 'var(--nhlb-muted)', fontFamily: 'Lato, sans-serif',
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    Go back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
