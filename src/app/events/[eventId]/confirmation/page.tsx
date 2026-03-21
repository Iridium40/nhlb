import { createSupabaseAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EventConfirmationPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const supabase = createSupabaseAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

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
            </p>
            {event.location && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                📍 {event.location}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/events" style={{
              padding: '12px 24px', borderRadius: 8,
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              textDecoration: 'none',
            }}>
              View More Events
            </Link>
            <Link href="/book" style={{
              padding: '12px 24px', borderRadius: 8,
              border: '1px solid var(--nhlb-border)', backgroundColor: 'white',
              color: 'var(--nhlb-muted)',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              textDecoration: 'none',
            }}>
              Book a Session
            </Link>
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
