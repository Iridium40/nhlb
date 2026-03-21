import { createSupabaseAdminClient } from '@/lib/supabase'
import { format, isPast } from 'date-fns'
import Link from 'next/link'
import type { Event } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Events — No Heart Left Behind',
  description: 'Upcoming events at No Heart Left Behind.',
}

export default async function EventsPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })

  const events: Event[] = data ?? []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
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
        justifyContent: 'space-between', height: 80,
      }}>
        <a href="https://www.noheartleftbehind.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
            alt="No Heart Left Behind" style={{ height: 56, width: 'auto' }}
          />
        </a>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/book" style={{
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>Book a Session</Link>
          <Link href="/donate" style={{
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.06em', padding: '8px 20px', borderRadius: 4,
            textDecoration: 'none',
          }}>Donate</Link>
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
        }}>
          Upcoming Events
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 40 }}>
          Join us for community events, workshops, and gatherings.
        </p>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
              No upcoming events right now. Check back soon!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', border: '1px solid var(--nhlb-border)',
                  borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}>
                  {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.image_url}
                      alt={event.title}
                      style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <h2 style={{
                          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
                          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px',
                        }}>
                          {event.title}
                        </h2>
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
                          📅 {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')} at {format(new Date(event.event_date), 'h:mm a')}
                        </p>
                        {event.location && (
                          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                            📍 {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p style={{
                            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
                            color: 'var(--nhlb-muted)', margin: '8px 0 0', lineHeight: 1.5,
                          }}>
                            {event.description.length > 150 ? event.description.slice(0, 150) + '...' : event.description}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {event.registration_fee_cents > 0 ? (
                          <p style={{
                            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1.1rem',
                            color: 'var(--nhlb-red-dark)', margin: '0 0 2px',
                          }}>
                            ${(event.registration_fee_cents / 100).toFixed(2)}
                          </p>
                        ) : (
                          <p style={{
                            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                            color: '#065F46', margin: '0 0 2px',
                          }}>
                            Free
                          </p>
                        )}
                        {event.registration_fee_cents > 0 && (
                          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                            {event.fee_label}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: 'var(--nhlb-blush)', padding: '24px 48px', color: 'white' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', margin: 0 }}>
          No Heart Left Behind &copy; {new Date().getFullYear()} &ensp;&middot;&ensp; 985-264-8808
        </p>
      </footer>
    </div>
  )
}
