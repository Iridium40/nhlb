'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

type SavedCard = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  diners: 'Diners',
  jcb: 'JCB',
  unionpay: 'UnionPay',
}

export default function PaymentMethodsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<SavedCard[]>([])
  const [addingCard, setAddingCard] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    try {
      const res = await fetch('/api/client/payment-methods')
      if (res.status === 401) { router.replace('/book'); return }
      const json = await res.json()
      setCards(json.paymentMethods ?? [])
    } catch {
      router.replace('/book')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadCards() }, [loadCards])

  const startAddCard = async () => {
    setAddingCard(true)
    try {
      const res = await fetch('/api/client/payment-methods', { method: 'POST' })
      const json = await res.json()
      if (json.clientSecret) {
        setClientSecret(json.clientSecret)
      } else {
        setToast('Could not initialize card setup.')
        setTimeout(() => setToast(null), 3000)
        setAddingCard(false)
      }
    } catch {
      setToast('Something went wrong.')
      setTimeout(() => setToast(null), 3000)
      setAddingCard(false)
    }
  }

  const handleCardAdded = () => {
    setAddingCard(false)
    setClientSecret(null)
    setToast('Payment method added!')
    setTimeout(() => setToast(null), 3000)
    loadCards()
  }

  const handleRemoveCard = async (pmId: string) => {
    setRemovingId(pmId)
    try {
      const res = await fetch('/api/client/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })
      if (res.ok) {
        setCards(prev => prev.filter(c => c.id !== pmId))
        setToast('Card removed.')
        setTimeout(() => setToast(null), 3000)
      }
    } finally {
      setRemovingId(null)
    }
  }

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
        Payment Methods
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <Link href="/book" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; Back</Link>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 0 20px',
        }}>Payment Methods</h1>
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

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px 80px' }}>

        {!stripePromise && (
          <div style={{
            marginBottom: 24, padding: '14px 16px',
            backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#92400E',
          }}>
            Payment integration is not configured yet. This feature will be available once Stripe is set up.
          </div>
        )}

        {/* Saved cards */}
        {cards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {cards.map(card => (
              <div key={card.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 10, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 28, borderRadius: 4,
                    backgroundColor: '#F3F4F6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Lato, sans-serif', fontSize: '0.65rem',
                    fontWeight: 700, color: '#374151', textTransform: 'uppercase',
                  }}>
                    {BRAND_LABELS[card.brand] ?? card.brand}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.9rem', fontWeight: 600, color: 'var(--nhlb-text)', margin: '0 0 2px' }}>
                      •••• {card.last4}
                    </p>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                      Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleRemoveCard(card.id)} disabled={removingId === card.id} style={{
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                  backgroundColor: 'white', color: '#B91C1C', border: '1px solid #FECACA',
                  opacity: removingId === card.id ? 0.5 : 1,
                }}>
                  {removingId === card.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px 20px', marginBottom: 24,
            background: 'white', border: '1px solid var(--nhlb-border)', borderRadius: 12,
          }}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
              No saved payment methods.
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
              Add a card below for faster checkout.
            </p>
          </div>
        )}

        {/* Add card section */}
        {!addingCard && stripePromise && (
          <button onClick={startAddCard} style={{
            width: '100%', padding: '14px 24px', borderRadius: 8, border: '2px dashed var(--nhlb-border)',
            backgroundColor: 'white', color: 'var(--nhlb-red-dark)',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', transition: 'all 0.12s',
          }}>
            + Add Payment Method
          </button>
        )}

        {addingCard && clientSecret && stripePromise && (
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '24px', marginTop: 8,
          }}>
            <h3 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 16px',
            }}>
              Add a Card
            </h3>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <SetupForm onSuccess={handleCardAdded} onCancel={() => { setAddingCard(false); setClientSecret(null) }} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  )
}

function SetupForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: setupError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/payment-methods`,
      },
      redirect: 'if_required',
    })

    if (setupError) {
      setError(setupError.message ?? 'Could not save card.')
      setSubmitting(false)
    } else {
      onSuccess()
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
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" disabled={!stripe || submitting} style={{
          flex: 1, padding: '12px 20px', borderRadius: 8, border: 'none',
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem',
          cursor: 'pointer', opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? 'Saving...' : 'Save Card'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '12px 20px', borderRadius: 8,
          backgroundColor: 'white', color: 'var(--nhlb-muted)',
          border: '1px solid var(--nhlb-border)',
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </form>
  )
}
