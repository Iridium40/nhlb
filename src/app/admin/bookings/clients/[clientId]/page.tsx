'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import type { Client, Booking, SessionNote, HipaaFormData } from '@/types'

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  CONFIRMED: { backgroundColor: '#D1FAE5', color: '#065F46' },
  CANCELLED: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  COMPLETED: { backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)' },
}

const S = {
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 4,
  } as React.CSSProperties,
}

function NoteEditor({ booking, clientId, existingNote, onSaved }: {
  booking: Booking
  clientId: string
  existingNote?: SessionNote
  onSaved: () => void
}) {
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/clients/${clientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: booking.id,
        counselor_id: booking.counselor_id,
        content,
      }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div style={{
      marginTop: 12, padding: '16px 18px',
      backgroundColor: 'var(--nhlb-cream-dark)', border: '1px solid var(--nhlb-blush-light)',
      borderRadius: 10,
    }}>
      <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: 'var(--nhlb-muted)', letterSpacing: '0.06em', margin: '0 0 12px' }}>
        SESSION NOTES
      </p>
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Notes</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          style={{ ...S.input, resize: 'none' }} rows={3}
          placeholder="Session summary, goals discussed, progress..." />
      </div>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', fontStyle: 'italic', margin: '0 0 12px' }}>
        Private clinical notes are only visible to the counselor in their portal.
      </p>
      <button onClick={save} disabled={saving} style={{
        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
        backgroundColor: 'var(--nhlb-red)', color: 'white',
        fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? 'Saving...' : existingNote ? 'Update Notes' : 'Save Notes'}
      </button>
    </div>
  )
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [hipaaCompleted, setHipaaCompleted] = useState(false)
  const [hipaaData, setHipaaData] = useState<HipaaFormData | null>(null)
  const [hipaaCompletedAt, setHipaaCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [clientRes, notesRes] = await Promise.all([
      fetch(`/api/clients/${clientId}`),
      fetch(`/api/clients/${clientId}/notes`),
    ])
    const clientJson = await clientRes.json()
    const notesJson = await notesRes.json()
    setClient(clientJson.client)
    setBookings(clientJson.bookings ?? [])
    setHipaaCompleted(clientJson.hipaaCompleted ?? false)
    setHipaaData(clientJson.hipaaIntake?.form_data ?? null)
    setHipaaCompletedAt(clientJson.hipaaIntake?.completed_at ?? null)
    setNotes(notesJson.notes ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  if (!client) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Client not found</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Client Record
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <a href="/admin/bookings/clients" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; All Clients</a>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {/* Client info card */}
        <div style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '24px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600,
            }}>
              {client.first_name[0]}{client.last_name[0]}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                {client.first_name} {client.last_name}
              </h2>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                {client.email}{client.phone ? ` · ${client.phone}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
              fontFamily: 'Lato, sans-serif', backgroundColor: 'var(--nhlb-cream-dark)',
              color: 'var(--nhlb-muted)', textTransform: 'capitalize',
            }}>
              {client.service_type}
            </span>
            <span style={{
              padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
              backgroundColor: hipaaCompleted ? '#D1FAE5' : '#FEF3C7',
              color: hipaaCompleted ? '#065F46' : '#92400E',
            }}>
              HIPAA intake: {hipaaCompleted ? '✓ Complete' : 'Pending'}
            </span>
            <span style={{
              padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem',
              fontFamily: 'Lato, sans-serif', backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)',
            }}>
              {bookings.length} {bookings.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>

          {client.brief_reason && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 8,
              borderLeft: '3px solid var(--nhlb-blush)',
            }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: '0.95rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.5,
              }}>
                &ldquo;{client.brief_reason}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* HIPAA Intake Data */}
        {hipaaCompleted && hipaaData && (
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
                fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
              }}>
                HIPAA Intake
              </h3>
              {hipaaCompletedAt && (
                <span style={{
                  fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)',
                }}>
                  Completed {format(new Date(hipaaCompletedAt), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {hipaaData.health_history && (
                <div>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                    HEALTH HISTORY
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {hipaaData.health_history}
                  </p>
                </div>
              )}

              {hipaaData.current_medications && (
                <div>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                    CURRENT MEDICATIONS
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {hipaaData.current_medications}
                  </p>
                </div>
              )}

              {hipaaData.allergies && (
                <div>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                    ALLERGIES
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.6 }}>
                    {hipaaData.allergies}
                  </p>
                </div>
              )}

              {(hipaaData.emergency_contact_name || hipaaData.emergency_contact_phone) && (
                <div style={{
                  padding: '14px 18px', backgroundColor: 'var(--nhlb-cream-dark)',
                  borderRadius: 8,
                }}>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 6px' }}>
                    EMERGENCY CONTACT
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--nhlb-text)', margin: '0 0 2px' }}>
                    {hipaaData.emergency_contact_name}
                    {hipaaData.emergency_contact_relationship && (
                      <span style={{ fontWeight: 400, color: 'var(--nhlb-muted)' }}> ({hipaaData.emergency_contact_relationship})</span>
                    )}
                  </p>
                  {hipaaData.emergency_contact_phone && (
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                      {hipaaData.emergency_contact_phone}
                    </p>
                  )}
                </div>
              )}

              {hipaaData.consent_given && (
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#065F46', margin: 0 }}>
                  ✓ HIPAA consent acknowledged
                </p>
              )}
            </div>
          </div>
        )}

        {!hipaaCompleted && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠</span>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#92400E', margin: 0 }}>
              HIPAA intake form has not been completed yet. The client should have received a link via email after booking.
            </p>
          </div>
        )}

        {/* Booking history */}
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', marginBottom: 16,
        }}>
          Session History
        </h3>

        {bookings.length === 0 ? (
          <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>No sessions yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.map(b => {
              const note = notes.find(n => n.booking_id === b.id)
              const isExpanded = expandedBooking === b.id

              return (
                <div key={b.id} style={{
                  background: 'white', border: '1px solid var(--nhlb-border)',
                  borderRadius: 10, padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--nhlb-text)' }}>
                          {format(new Date(b.scheduled_at), 'MMM d, yyyy')} at {format(new Date(b.scheduled_at), 'h:mm a')}
                        </span>
                        <span style={{
                          ...STATUS_STYLES[b.status],
                          padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem',
                          fontWeight: 700, fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
                        }}>
                          {b.status.toLowerCase()}
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem',
                          fontFamily: 'Lato, sans-serif',
                          backgroundColor: b.type === 'VIRTUAL' ? '#EFF6FF' : 'var(--nhlb-cream-dark)',
                          color: b.type === 'VIRTUAL' ? '#1D4ED8' : 'var(--nhlb-muted)',
                        }}>
                          {b.type === 'VIRTUAL' ? 'Virtual' : 'In Person'}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                        {b.counselor?.name}{b.donation_amount_cents > 0 ? ` · $${(b.donation_amount_cents / 100).toFixed(2)} donation` : ''}
                      </p>
                    </div>

                    {b.status !== 'CANCELLED' && (
                      <button onClick={() => setExpandedBooking(isExpanded ? null : b.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                        color: 'var(--nhlb-red)', padding: 0,
                      }}>
                        {isExpanded ? '▾ Hide notes' : note ? '▸ Edit notes' : '▸ Add notes'}
                      </button>
                    )}
                  </div>

                  {isExpanded && b.status !== 'CANCELLED' && (
                    <NoteEditor
                      booking={b}
                      clientId={client.id}
                      existingNote={note}
                      onSaved={load}
                    />
                  )}

                  {!isExpanded && note && note.content && (
                    <div style={{
                      marginTop: 10, padding: '10px 14px',
                      backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 8,
                    }}>
                      <p style={{
                        fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
                        color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.5,
                      }}>
                        {note.content.length > 120 ? note.content.slice(0, 120) + '...' : note.content}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
