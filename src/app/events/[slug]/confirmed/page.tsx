'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Suspense } from 'react'
import type { Event } from '@/types'

function ConfirmedContent() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const regId = searchParams.get('reg')

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/events/by-slug/${slug}`)
      if (res.ok) {
        const json = await res.json()
        setEvent(json.event)
      }
      setLoading(false)
    })()
  }, [slug])

  const handleDownloadICS = async () => {
    if (!event) return
    const startDate = new Date(event.event_date)
    const endDate = event.end_date ? new Date(event.end_date) : startDate

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//No Heart Left Behind//Events//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${regId || Date.now()}@noheartleftbehind.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : '',
      `URL:${window.location.origin}/events/${slug}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'event.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${slug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/events/${slug}`)}`,
      '_blank', 'noopener,noreferrer'
    )
  }

  const handleShareEmail = () => {
    if (!event) return
    const subject = encodeURIComponent(event.title)
    const body = encodeURIComponent(`I thought you might be interested: ${window.location.origin}/events/${slug}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
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

  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${slug}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Registration Confirmed
      </div>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EAF5EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2D7A4F" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
          }}>
            You&apos;re registered!
          </h1>

          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '24px', textAlign: 'left', marginBottom: 24,
          }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
            }}>
              {event.title}
            </h2>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
              📅 {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')} at {format(new Date(event.event_date), 'h:mm a')}
              {event.end_date && ` – ${format(new Date(event.end_date), 'h:mm a')}`}
            </p>
            {event.location && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                📍 {event.location}
              </p>
            )}
          </div>

          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', marginBottom: 24 }}>
            A confirmation email has been sent to your email address.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <button onClick={handleDownloadICS} style={{
              padding: '12px 24px', borderRadius: 8,
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              border: 'none', cursor: 'pointer',
            }}>
              📅 Add to Calendar
            </button>
            <Link href="/events" style={{
              padding: '12px 24px', borderRadius: 8,
              border: '1px solid var(--nhlb-border)', backgroundColor: 'white',
              color: 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}>
              View More Events
            </Link>
          </div>

          {/* Share section */}
          <div style={{
            borderTop: '1px solid var(--nhlb-border)', paddingTop: 20,
          }}>
            <p style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--nhlb-muted)', margin: '0 0 12px',
            }}>
              Share this event:
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
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

          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '1rem', color: 'var(--nhlb-muted)', marginTop: 48,
          }}>
            &ldquo;As a man thinks in his heart, so is he.&rdquo;<br />
            <span style={{ fontSize: '0.85rem' }}>&mdash; Proverbs 23:7</span>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    }>
      <ConfirmedContent />
    </Suspense>
  )
}
