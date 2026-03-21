'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Event, EventCustomField } from '@/types'

const S = {
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 6,
  } as React.CSSProperties,
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [customData, setCustomData] = useState<Record<string, string | boolean>>({})

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/events/${eventId}`)
      if (!res.ok) { setLoading(false); return }
      const json = await res.json()
      setEvent(json.event)
      setLoading(false)
    })()
  }, [eventId])

  const updateCustom = (name: string, value: string | boolean) => {
    setCustomData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please fill in your name and email.')
      return
    }
    setSubmitting(true)
    setError(null)

    // If event has a fee and Stripe is configured, create payment intent
    let stripePaymentId: string | undefined
    if (event && event.registration_fee_cents > 0 && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      try {
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountCents: event.registration_fee_cents,
            clientEmail: email,
            clientName: `${firstName} ${lastName}`,
          }),
        })
        const piJson = await piRes.json()
        if (piJson.paymentIntentId) stripePaymentId = piJson.paymentIntentId
      } catch {
        // Continue in dev mode
      }
    }

    const res = await fetch(`/api/events/${eventId}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
        custom_data: customData,
        amount_paid_cents: event?.registration_fee_cents ?? 0,
        stripe_payment_id: stripePaymentId,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Registration failed'); setSubmitting(false); return }
    router.push(`/events/${eventId}/confirmation`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Event not found</p>
    </div>
  )

  const atCapacity = event.max_capacity && (event.registration_count ?? 0) >= event.max_capacity

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Event Registration
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <a href="/events" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; All Events</a>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 24 }}
          />
        )}
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
        }}>
          {event.title}
        </h1>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)' }}>
            📅 {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')} at {format(new Date(event.event_date), 'h:mm a')}
          </span>
          {event.location && (
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)' }}>
              📍 {event.location}
            </span>
          )}
        </div>
        {event.registration_fee_cents > 0 && (
          <div style={{
            display: 'inline-block', padding: '4px 14px',
            backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 20,
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red-dark)', marginBottom: 16,
          }}>
            {event.fee_label}: ${(event.registration_fee_cents / 100).toFixed(2)}
          </div>
        )}
        {event.description && (
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.95rem', lineHeight: 1.7,
            color: 'var(--nhlb-text)', marginBottom: 32,
          }}>
            {event.description}
          </p>
        )}

        {atCapacity ? (
          <div style={{
            padding: '24px', textAlign: 'center', backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 12,
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: '#B91C1C', margin: 0 }}>
              This event is at full capacity
            </p>
          </div>
        ) : (
          <>
            {/* Registration form */}
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: '28px', marginBottom: 24,
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
                fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 20px',
              }}>Register</h2>

              {error && (
                <div style={{
                  marginBottom: 16, padding: '12px 14px',
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={S.label}>First name *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} style={S.input} className="input-brand" /></div>
                <div><label style={S.label}>Last name *</label><input value={lastName} onChange={e => setLastName(e.target.value)} style={S.input} className="input-brand" /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={S.label}>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} className="input-brand" /></div>
              <div style={{ marginBottom: 16 }}><label style={S.label}>Phone</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={S.input} className="input-brand" /></div>

              {/* Custom event fields */}
              {(event.custom_fields ?? []).map((field: EventCustomField) => (
                <div key={field.name} style={{ marginBottom: 16 }}>
                  <label style={S.label}>{field.label}{field.required ? ' *' : ''}</label>
                  {field.type === 'text' && (
                    <input value={(customData[field.name] as string) ?? ''} onChange={e => updateCustom(field.name, e.target.value)} style={S.input} className="input-brand" />
                  )}
                  {field.type === 'select' && (
                    <select value={(customData[field.name] as string) ?? ''} onChange={e => updateCustom(field.name, e.target.value)} style={S.input}>
                      <option value="">Select...</option>
                      {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!customData[field.name]} onChange={e => updateCustom(field.name, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }} />
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem' }}>{field.label}</span>
                    </label>
                  )}
                </div>
              ))}

              {event.registration_fee_cents > 0 && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <div style={{
                  marginBottom: 16, padding: '12px 14px',
                  backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
                  borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#92400E',
                }}>
                  Payment integration pending &mdash; registration will proceed without payment.
                </div>
              )}

              <button onClick={handleRegister} disabled={submitting} style={{
                width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none',
                backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', opacity: submitting ? 0.6 : 1,
              }} className="btn-primary">
                {submitting ? 'Registering...' :
                  event.registration_fee_cents > 0
                    ? `Register & Pay $${(event.registration_fee_cents / 100).toFixed(2)}`
                    : 'Register'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
