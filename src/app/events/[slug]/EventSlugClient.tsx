'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, isPast, isFuture } from 'date-fns'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Event, EventCustomField } from '@/types'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const S = {
  input: {
    width: '100%',
    border: '1px solid var(--nhlb-border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.875rem',
    fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)',
    background: 'white',
    outline: 'none',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontFamily: 'Lato, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)',
    marginBottom: 6,
  } as React.CSSProperties,
  primaryBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'var(--nhlb-red)',
    color: 'white',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 700,
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
}

export default function EventSlugClient({ slug }: { slug: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [customData, setCustomData] = useState<Record<string, string | boolean>>({})

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/events/by-slug/${slug}`)
        if (!res.ok) { setLoading(false); return }
        const json = await res.json()
        setEvent(json.event)
      } catch {
        /* network error */
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const updateCustom = (name: string, value: string | boolean) => {
    setCustomData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (!event) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/events/${event.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || undefined,
          custom_data: customData,
          amount_paid_cents: event.registration_fee_cents,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Registration failed')
        setSubmitting(false)
        return
      }

      if (json.requiresPayment && json.clientSecret) {
        setRegistrationId(json.registrationId)
        setClientSecret(json.clientSecret)
        setSubmitting(false)
      } else {
        router.push(`/events/${slug}/confirmed?reg=${json.registrationId}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const handleShareEmail = () => {
    if (!event) return
    const subject = encodeURIComponent(event.title)
    const body = encodeURIComponent(
      `Check out this event: ${event.title}\n\n${window.location.href}`,
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  /* ─── Loading ────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    )
  }

  /* ─── Not found / Not published ──────────────── */
  if (!event || !event.is_published) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--nhlb-red-dark)', marginBottom: 16 }}>
          Event not found
        </p>
        <Link href="/events" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 700,
          color: 'var(--nhlb-red)', textDecoration: 'none',
        }}>
          ← Browse upcoming events
        </Link>
      </div>
    )
  }

  /* ─── Cancelled ──────────────────────────────── */
  if (event.cancelled_at) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
        <PageHeader />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#B91C1C" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
            }}>
              Event Cancelled
            </h1>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', color: 'var(--nhlb-text)', margin: '0 0 8px' }}>
              <strong>{event.title}</strong> has been cancelled.
            </p>
            {event.cancellation_reason && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: '0 0 8px' }}>
                {event.cancellation_reason}
              </p>
            )}
            {event.registration_fee_cents > 0 && (
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
                color: 'var(--nhlb-muted)', margin: '0 0 24px',
                padding: '12px 16px', backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D', borderRadius: 8, textAlign: 'left',
              }}>
                If you already registered and paid, a refund will be processed automatically. Please allow 5–10 business days for it to appear on your statement.
              </p>
            )}
            <Link href="/events" style={{
              display: 'inline-block', padding: '12px 28px', borderRadius: 8,
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              textDecoration: 'none',
            }}>
              Browse Upcoming Events
            </Link>
          </div>
        </main>
      </div>
    )
  }

  /* ─── Registration state ─────────────────────── */
  const now = new Date()
  const regNotOpenYet = event.registration_opens_at && isFuture(new Date(event.registration_opens_at))
  const regClosed = event.registration_closes_at && isPast(new Date(event.registration_closes_at))
  const atCapacity = event.max_capacity != null && (event.registration_count ?? 0) >= event.max_capacity
  const canRegister = !regNotOpenYet && !regClosed && !atCapacity

  const feeDisplay = event.registration_fee_cents > 0
    ? `$${(event.registration_fee_cents / 100).toFixed(2)}`
    : 'Free'

  /* ─── Stripe payment step ────────────────────── */
  if (clientSecret && registrationId && stripePromise) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
        <PageHeader />
        <main style={{ flex: 1, maxWidth: 520, width: '100%', margin: '0 auto', padding: '40px 24px 80px' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
          }}>
            Complete Payment
          </h2>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', marginBottom: 24 }}>
            {event.fee_label}: {feeDisplay}
          </p>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: 28,
          }}>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <PaymentForm
                slug={slug}
                registrationId={registrationId}
              />
            </Elements>
          </div>
        </main>
      </div>
    )
  }

  /* ─── Main event page ────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <main style={{ flex: 1 }}>
        {/* Banner image */}
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
          {/* Date label */}
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--nhlb-muted)', margin: '0 0 8px',
          }}>
            {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy').toUpperCase()}
          </p>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 600, color: 'var(--nhlb-red-dark)',
            margin: '0 0 16px', lineHeight: 1.15,
          }}>
            {event.title}
          </h1>

          {/* Location */}
          {event.location && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.95rem', color: 'var(--nhlb-text)', margin: '0 0 6px' }}>
              📍 {event.location}
            </p>
          )}

          {/* Time range */}
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.95rem', color: 'var(--nhlb-text)', margin: '0 0 16px' }}>
            🕐 {format(new Date(event.event_date), 'h:mm a')}
            {event.end_date && ` – ${format(new Date(event.end_date), 'h:mm a')}`}
          </p>

          {/* Price badge */}
          <div style={{
            display: 'inline-block', padding: '5px 16px',
            backgroundColor: event.registration_fee_cents > 0 ? 'var(--nhlb-cream-dark)' : '#EAF5EE',
            borderRadius: 20,
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: event.registration_fee_cents > 0 ? 'var(--nhlb-red-dark)' : '#065F46',
            marginBottom: 28,
          }}>
            {event.registration_fee_cents > 0
              ? `${event.fee_label}: ${feeDisplay}`
              : 'Free'}
          </div>

          {/* Description */}
          {event.description && (
            <div style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.95rem', lineHeight: 1.75,
              color: 'var(--nhlb-text)', marginBottom: 40,
              whiteSpace: 'pre-wrap',
            }}>
              {event.description}
            </div>
          )}

          {/* Share tools */}
          <div style={{
            borderTop: '1px solid var(--nhlb-border)',
            paddingTop: 20, marginBottom: 40,
          }}>
            <p style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--nhlb-muted)', margin: '0 0 12px',
            }}>
              Share this event:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleCopyLink} style={{
                padding: '8px 16px', borderRadius: 6,
                border: '1px solid var(--nhlb-border)', backgroundColor: 'white',
                fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--nhlb-text)', cursor: 'pointer',
              }}>
                {copied ? '✓ Copied!' : '🔗 Copy link'}
              </button>
              <button onClick={handleShareFacebook} style={{
                padding: '8px 16px', borderRadius: 6,
                border: '1px solid var(--nhlb-border)', backgroundColor: 'white',
                fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--nhlb-text)', cursor: 'pointer',
              }}>
                📘 Facebook
              </button>
              <button onClick={handleShareEmail} style={{
                padding: '8px 16px', borderRadius: 6,
                border: '1px solid var(--nhlb-border)', backgroundColor: 'white',
                fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--nhlb-text)', cursor: 'pointer',
              }}>
                ✉️ Email a friend
              </button>
            </div>
          </div>

          {/* Registration section */}
          {regNotOpenYet && (
            <div style={{
              padding: 24, textAlign: 'center',
              backgroundColor: 'var(--nhlb-blush-light)', border: '1px solid var(--nhlb-border)',
              borderRadius: 12,
            }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: 'var(--nhlb-red-dark)', margin: 0 }}>
                Registration opens {format(new Date(event.registration_opens_at!), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}

          {regClosed && !regNotOpenYet && (
            <div style={{
              padding: 24, textAlign: 'center',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12,
            }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: '#B91C1C', margin: 0 }}>
                Registration is closed
              </p>
            </div>
          )}

          {atCapacity && !regClosed && !regNotOpenYet && (
            <div style={{
              padding: 24, textAlign: 'center',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12,
            }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: '#B91C1C', margin: 0 }}>
                This event is full
              </p>
            </div>
          )}

          {canRegister && (
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: 28,
            }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
                fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 20px',
              }}>
                Register
              </h2>

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
                <div>
                  <label style={S.label}>First name *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} style={S.input} className="input-brand" />
                </div>
                <div>
                  <label style={S.label}>Last name *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} style={S.input} className="input-brand" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} className="input-brand" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Phone *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={S.input} className="input-brand" />
              </div>

              {/* Dynamic custom fields */}
              {(event.custom_fields ?? []).map((field: EventCustomField) => (
                <div key={field.name} style={{ marginBottom: 16 }}>
                  <label style={S.label}>{field.label}{field.required ? ' *' : ''}</label>
                  {field.type === 'text' && (
                    <input
                      value={(customData[field.name] as string) ?? ''}
                      onChange={e => updateCustom(field.name, e.target.value)}
                      style={S.input}
                      className="input-brand"
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      value={(customData[field.name] as string) ?? ''}
                      onChange={e => updateCustom(field.name, e.target.value)}
                      style={S.input}
                    >
                      <option value="">Select...</option>
                      {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!customData[field.name]}
                        onChange={e => updateCustom(field.name, e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }}
                      />
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem' }}>{field.label}</span>
                    </label>
                  )}
                </div>
              ))}

              <button
                onClick={handleRegister}
                disabled={submitting}
                style={{ ...S.primaryBtn, opacity: submitting ? 0.6 : 1 }}
                className="btn-primary"
              >
                {submitting
                  ? 'Registering...'
                  : event.registration_fee_cents > 0
                    ? `Register & Pay ${feeDisplay}`
                    : 'Register (Free)'}
              </button>
            </div>
          )}
        </div>
      </main>

      <footer style={{ backgroundColor: 'var(--nhlb-blush)', padding: '24px 48px', color: 'white' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', margin: 0 }}>
          No Heart Left Behind &copy; {new Date().getFullYear()} &ensp;&middot;&ensp; 985-264-8808
        </p>
      </footer>
    </div>
  )
}

/* ─── Shared page header ─────────────────────── */

function PageHeader() {
  return (
    <>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Let&apos;s Build Hope &amp; Healing TOGETHER!
      </div>
      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 72,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="https://www.noheartleftbehind.com" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
              alt="No Heart Left Behind"
              style={{ height: 48, width: 'auto' }}
            />
          </a>
          <Link href="/events" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>
            ← All Events
          </Link>
        </div>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/donate" style={{
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.06em', padding: '8px 20px', borderRadius: 4,
            textDecoration: 'none',
          }}>
            Donate
          </Link>
        </nav>
      </header>
    </>
  )
}

/* ─── Stripe payment form ────────────────────── */

function PaymentForm({ slug, registrationId }: { slug: string; registrationId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: paymentError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/events/${slug}/confirmed?reg=${registrationId}`,
      },
      redirect: 'if_required',
    })

    if (paymentError) {
      setError(paymentError.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
    } else {
      router.push(`/events/${slug}/confirmed?reg=${registrationId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#B91C1C',
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{ ...S.primaryBtn, marginTop: 20, opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}
