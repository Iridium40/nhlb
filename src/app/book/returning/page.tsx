'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Client, Counselor, TimeSlot } from '@/types'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type Step = 'loading' | 'schedule' | 'payment' | 'checkout'

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
  btn: {
    width: '100%', backgroundColor: 'var(--nhlb-red)', color: 'white',
    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
    letterSpacing: '0.05em', padding: '14px 24px', borderRadius: 8,
    border: 'none', cursor: 'pointer',
  } as React.CSSProperties,
}

export default function ReturningClientPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    }>
      <ReturningClientInner />
    </Suspense>
  )
}

function ReturningClientInner() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [client, setClient] = useState<Client | null>(null)
  const [assignedCounselor, setAssignedCounselor] = useState<Counselor | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/client-session')
        const json = await res.json()
        if (json.client) {
          setClient(json.client)
          setAssignedCounselor(json.assignedCounselor ?? null)
          setStripeCustomerId(json.client.stripe_customer_id ?? null)
          setStep('schedule')

          // Load saved cards
          if (stripePromise) {
            fetch('/api/client/payment-methods')
              .then(r => r.json())
              .then(j => {
                const cards = j.paymentMethods ?? []
                setSavedCards(cards)
                if (cards.length > 0) setSelectedCardId(cards[0].id)
              })
              .catch(() => {})
          }
        } else {
          router.replace('/book')
        }
      } catch {
        router.replace('/book')
      }
    }
    checkSession()
  }, [router])

  // Schedule
  const [sessionType, setSessionType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Payment
  const [donationAmount, setDonationAmount] = useState('50')

  // Stripe checkout
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  // Saved cards
  type SavedCard = { id: string; brand: string; last4: string; expMonth: number; expYear: number }
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [useNewCard, setUseNewCard] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true)
    const counselorParam = assignedCounselor ? `&counselorId=${assignedCounselor.id}` : ''
    const res = await fetch(`/api/booking/availability?newClient=false${counselorParam}`)
    const json = await res.json()
    setSlots(json.slots ?? [])
    setLoadingSlots(false)
  }, [assignedCounselor])

  useEffect(() => {
    if (step === 'schedule') loadSlots()
  }, [step, loadSlots])

  const selectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('payment')
  }

  const handleBooking = async () => {
    if (!selectedSlot || !client) return
    setSubmitting(true)
    setError(null)
    const amountCents = Math.round((parseFloat(donationAmount) || 0) * 100)

    try {
      // 1. Create the booking
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone: client.phone || undefined,
          service_type: client.service_type,
          counselor_id: selectedSlot.counselorId,
          scheduled_at: selectedSlot.start,
          type: sessionType,
          donation_amount_cents: amountCents,
          client_id: client.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Could not create session')
        setSubmitting(false)
        return
      }

      setBookingId(json.bookingId)

      // 2. If Stripe is configured and amount >= $10, handle payment
      if (amountCents >= 1000 && stripePromise) {
        // If using a saved card, charge it directly
        if (selectedCardId && !useNewCard && stripeCustomerId) {
          const piRes = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountCents,
              clientEmail: client.email,
              clientName: `${client.first_name} ${client.last_name}`,
              bookingId: json.bookingId,
              stripeCustomerId,
              paymentMethodId: selectedCardId,
            }),
          })
          const piJson = await piRes.json()
          if (piJson.confirmed) {
            router.push(`/book/confirmation/${json.bookingId}`)
            return
          }
          if (piJson.error) {
            setError(typeof piJson.error === 'string' ? piJson.error : 'Payment failed with saved card.')
            setSubmitting(false)
            return
          }
        }

        // Otherwise show Stripe Elements for a new card
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountCents,
            clientEmail: client.email,
            clientName: `${client.first_name} ${client.last_name}`,
            bookingId: json.bookingId,
            stripeCustomerId: stripeCustomerId ?? undefined,
          }),
        })
        const piJson = await piRes.json()
        if (piJson.clientSecret) {
          setClientSecret(piJson.clientSecret)
          setStep('checkout')
          setSubmitting(false)
          return
        }
      }

      // 3. No payment needed — go to confirmation
      router.push(`/book/confirmation/${json.bookingId}`)
    } catch {
      setError('Something went wrong.')
      setSubmitting(false)
    }
  }

  const groupedSlots = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const key = format(new Date(slot.start), 'EEE, MMM d')
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  if (step === 'loading') {
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
        Returning Client
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <a href="/book" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; Back</a>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 0 20px',
        }}>Welcome Back</h1>
      </header>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px 80px' }}>

        {error && (
          <div style={{
            marginBottom: 24, padding: '14px 16px',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: '#B91C1C',
          }}>
            {error}
          </div>
        )}

        {/* Schedule */}
        {step === 'schedule' && client && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Welcome back, {client.first_name}!
            </h2>
            {assignedCounselor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                  backgroundColor: '#F3F4F6', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--nhlb-border)',
                }}>
                  {assignedCounselor.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={assignedCounselor.photo_url} alt={assignedCounselor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Scheduling with <strong style={{ color: 'var(--nhlb-red-dark)' }}>{assignedCounselor.name}</strong>
                </p>
              </div>
            )}

            {/* Session type toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {([
                { v: 'IN_PERSON' as const, emoji: '🏠', label: 'In Person' },
                { v: 'VIRTUAL' as const, emoji: '💻', label: 'Virtual', disabled: !assignedCounselor?.zoom_link },
              ] as const).map(({ v, emoji, label, ...rest }) => {
                const disabled = 'disabled' in rest ? rest.disabled : false
                return (
                  <button key={v} onClick={() => !disabled && setSessionType(v)}
                    disabled={!!disabled}
                    style={{
                      padding: '14px 12px', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
                      border: `2px solid ${sessionType === v ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                      backgroundColor: sessionType === v ? 'var(--nhlb-red)' : 'white',
                      color: sessionType === v ? 'white' : disabled ? 'var(--nhlb-blush)' : 'var(--nhlb-text)',
                      borderRadius: 10, transition: 'all 0.12s', opacity: disabled ? 0.5 : 1,
                    }}>
                    <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: 4 }}>{emoji}</span>
                    <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700 }}>{label}</span>
                  </button>
                )
              })}
            </div>

            {loadingSlots ? (
              <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
                Loading available times...
              </p>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
                No available slots right now.
              </p>
            ) : (
              <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 4, marginBottom: 28 }}>
                {Object.entries(groupedSlots).map(([day, daySlots]) => (
                  <div key={day} style={{ marginBottom: 24 }}>
                    <p style={{
                      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--nhlb-muted)', marginBottom: 10,
                    }}>{day}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {daySlots.map(slot => (
                        <button key={slot.start} onClick={() => selectSlot(slot)} style={{
                          padding: '10px 4px', border: '1px solid var(--nhlb-border)', borderRadius: 8,
                          backgroundColor: 'white', fontFamily: 'Lato, sans-serif',
                          fontSize: '0.8rem', color: 'var(--nhlb-text)', cursor: 'pointer', transition: 'all 0.12s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget).style.backgroundColor = 'var(--nhlb-red)'
                          ;(e.currentTarget).style.color = 'white'
                          ;(e.currentTarget).style.borderColor = 'var(--nhlb-red)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget).style.backgroundColor = 'white'
                          ;(e.currentTarget).style.color = 'var(--nhlb-text)'
                          ;(e.currentTarget).style.borderColor = 'var(--nhlb-border)'
                        }}>
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

        {/* Payment */}
        {step === 'payment' && selectedSlot && client && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Love Offering
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                backgroundColor: '#F3F4F6', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--nhlb-border)',
              }}>
                {selectedSlot.counselorPhotoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selectedSlot.counselorPhotoUrl} alt={selectedSlot.counselorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
                {sessionType === 'VIRTUAL' ? '💻 Virtual' : '🏠 In-person'} session on{' '}
                <strong style={{ color: 'var(--nhlb-red-dark)' }}>
                  {format(new Date(selectedSlot.start), 'EEE, MMM d')} at {format(new Date(selectedSlot.start), 'h:mm a')}
                </strong>{' '}
                with {selectedSlot.counselorName}
              </p>
            </div>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              Minimum $10 love offering.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Amount</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
                {['10', '25', '50', '75', '100'].map(amt => (
                  <button key={amt} onClick={() => setDonationAmount(amt)} style={{
                    padding: '10px 4px',
                    border: `1px solid ${donationAmount === amt ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                    borderRadius: 8,
                    backgroundColor: donationAmount === amt ? 'var(--nhlb-red)' : 'white',
                    color: donationAmount === amt ? 'white' : 'var(--nhlb-text)',
                    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                  }}>
                    ${amt}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)',
                }}>$</span>
                <input type="number" min="10" step="1" value={donationAmount}
                  onChange={e => setDonationAmount(e.target.value)}
                  style={{ ...S.input, paddingLeft: 28 }} className="input-brand" />
              </div>
            </div>

            {/* Saved cards */}
            {savedCards.length > 0 && stripePromise && (
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savedCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => { setSelectedCardId(card.id); setUseNewCard(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 8,
                        border: `2px solid ${selectedCardId === card.id && !useNewCard ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                        backgroundColor: selectedCardId === card.id && !useNewCard ? 'var(--nhlb-cream)' : 'white',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <div style={{
                        width: 36, height: 24, borderRadius: 4,
                        backgroundColor: '#F3F4F6', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Lato, sans-serif', fontSize: '0.6rem',
                        fontWeight: 700, color: '#374151', textTransform: 'uppercase',
                        flexShrink: 0,
                      }}>
                        {card.brand}
                      </div>
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--nhlb-text)' }}>
                        •••• {card.last4}
                      </span>
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', marginLeft: 'auto' }}>
                        {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setUseNewCard(true); setSelectedCardId(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 16px', borderRadius: 8,
                      border: `2px solid ${useNewCard ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                      backgroundColor: useNewCard ? 'var(--nhlb-cream)' : 'white',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)',
                    }}
                  >
                    + Use a new card
                  </button>
                </div>
              </div>
            )}

            <button onClick={handleBooking}
              disabled={submitting || parseFloat(donationAmount) < 10}
              style={{ ...S.btn, opacity: submitting || parseFloat(donationAmount) < 10 ? 0.5 : 1 }}
              className="btn-primary">
              {submitting
                ? 'Processing...'
                : selectedCardId && !useNewCard && stripePromise
                  ? `Pay $${parseFloat(donationAmount || '10').toFixed(2)} with •••• ${savedCards.find(c => c.id === selectedCardId)?.last4 ?? ''}`
                  : stripePromise
                    ? `Continue to Payment — $${parseFloat(donationAmount || '10').toFixed(2)}`
                    : `Confirm & Give $${parseFloat(donationAmount || '10').toFixed(2)}`}
            </button>

            <button onClick={() => { setStep('schedule'); setSelectedSlot(null) }} style={{
              display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
              fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', cursor: 'pointer',
            }}>&larr; Choose a different time</button>
          </div>
        )}

        {/* Stripe Checkout */}
        {step === 'checkout' && clientSecret && bookingId && selectedSlot && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Complete Payment
            </h2>
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: '20px', marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                Love offering for your session with <strong style={{ color: 'var(--nhlb-red-dark)' }}>{selectedSlot.counselorName}</strong>
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                <strong style={{ color: 'var(--nhlb-red-dark)' }}>{format(new Date(selectedSlot.start), 'EEEE, MMMM d')}</strong> at <strong style={{ color: 'var(--nhlb-red-dark)' }}>{format(new Date(selectedSlot.start), 'h:mm a')}</strong>
              </p>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', marginBottom: 20 }}>
              ${parseFloat(donationAmount).toFixed(2)}
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: 28,
            }}>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <BookingPaymentForm bookingId={bookingId} />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BookingPaymentForm({ bookingId }: { bookingId: string }) {
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
        return_url: `${window.location.origin}/book/confirmation/${bookingId}`,
      },
      redirect: 'if_required',
    })

    if (paymentError) {
      setError(paymentError.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
    } else {
      router.push(`/book/confirmation/${bookingId}`)
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
        style={{
          width: '100%', backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
          letterSpacing: '0.05em', padding: '14px 24px', borderRadius: 8,
          border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
          marginTop: 20, opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  )
}
