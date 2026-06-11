import { createSupabaseAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Event } from '@/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://nhlb.vercel.app'

export const metadata: Metadata = {
  title: 'Events — No Heart Left Behind',
  description: 'Upcoming events at No Heart Left Behind — faith-based community gatherings, workshops, and retreats.',
  openGraph: {
    title: 'Upcoming Events — No Heart Left Behind',
    description: 'Join us for community events, workshops, and gatherings.',
    url: `${baseUrl}/events`,
    siteName: 'No Heart Left Behind',
    images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: 'No Heart Left Behind' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Upcoming Events — No Heart Left Behind',
    description: 'Join us for community events, workshops, and gatherings.',
  },
}

export default async function EventsPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .is('cancelled_at', null)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })

  const events: Event[] = data ?? []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Raleway, sans-serif',
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
          <span style={{ display: 'inline-flex', backgroundColor: 'var(--nhlb-red-dark)', borderRadius: 10, padding: '10px 16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="No Heart Left Behind" style={{ height: 34, width: 'auto', display: 'block' }} />
          </span>
        </a>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/book" style={{
            fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>Book a Session</Link>
          <Link href="/donate" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '0.85rem',
            letterSpacing: '0.04em', padding: '10px 24px', borderRadius: 9999,
            textDecoration: 'none',
          }}>
            Donate
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 800, width: '100%', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
        }}>
          Upcoming Events
        </h1>
        <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 40 }}>
          Join us for community events, workshops, and gatherings.
        </p>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
              No upcoming events right now. Check back soon!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map(event => {
              const href = event.slug ? `/events/${event.slug}` : `/events/${event.id}`
              const atCapacity = event.max_capacity != null && (event.registration_count ?? 0) >= event.max_capacity
              return (
                <Link key={event.id} href={href} style={{ textDecoration: 'none' }}>
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
                          <p style={{
                            fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: 'var(--nhlb-muted)', margin: '0 0 4px',
                          }}>
                            {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <h2 style={{
                            fontFamily: 'Playfair Display, serif', fontSize: '1.4rem',
                            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px',
                          }}>
                            {event.title}
                          </h2>
                          {event.location && (
                            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                              📍 {event.location}
                            </p>
                          )}
                          {event.description && (
                            <p style={{
                              fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem',
                              color: 'var(--nhlb-muted)', margin: '8px 0 0', lineHeight: 1.5,
                            }}>
                              {event.description.replace(/<[^>]+>/g, '').length > 150
                                ? event.description.replace(/<[^>]+>/g, '').slice(0, 150) + '...'
                                : event.description.replace(/<[^>]+>/g, '')}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {event.registration_fee_cents > 0 ? (
                            <p style={{
                              fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '1.1rem',
                              color: 'var(--nhlb-red-dark)', margin: '0 0 2px',
                            }}>
                              ${(event.registration_fee_cents / 100).toFixed(2)}
                            </p>
                          ) : (
                            <p style={{
                              fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                              color: '#065F46', margin: '0 0 2px',
                            }}>
                              Free
                            </p>
                          )}
                          {event.registration_fee_cents > 0 && (
                            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                              {event.fee_label}
                            </p>
                          )}
                          {atCapacity && (
                            <p style={{
                              fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                              color: '#B91C1C', margin: '8px 0 0',
                            }}>
                              Registration closed
                            </p>
                          )}
                          {!atCapacity && (
                            <p style={{
                              fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                              color: 'var(--nhlb-red)', margin: '8px 0 0',
                            }}>
                              Register →
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: 'var(--nhlb-blush)', padding: '24px 48px', color: 'white' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', margin: 0 }}>
          No Heart Left Behind &copy; {new Date().getFullYear()} &ensp;&middot;&ensp; 985-264-8808
        </p>
      </footer>
    </div>
  )
}
