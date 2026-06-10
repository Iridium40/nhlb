'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import SharePanel from '@/components/SharePanel'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nhlb.vercel.app'

interface CounselorProfile {
  id: string
  name: string
  title: string
  bio: string | null
  photo_url: string | null
  specialties: string[]
  slug: string
}

export default function CounselorProfilePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [counselor, setCounselor] = useState<CounselorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const loadCounselor = async () => {
      try {
        const res = await fetch(`/api/counselors/by-slug/${slug}`)
        if (!res.ok) {
          setError('Counselor not found')
          setLoading(false)
          return
        }
        const data = await res.json()
        setCounselor(data.counselor)
      } catch {
        setError('Failed to load counselor')
      } finally {
        setLoading(false)
      }
    }

    loadCounselor()
  }, [slug])

  const profileUrl = `${BASE_URL}/counselors/${slug}`

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    )
  }

  if (error || !counselor) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: 'var(--nhlb-red-dark)', marginBottom: 16 }}>
              Counselor Not Found
            </h1>
            <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 24 }}>
              The counselor you&apos;re looking for may not be available.
            </p>
            <Link href="/book" style={{
              display: 'inline-block',
              backgroundColor: 'var(--nhlb-red)',
              color: 'white',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '12px 24px',
              borderRadius: 6,
              textDecoration: 'none',
            }}>
              View All Counselors
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '40px 24px 60px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Profile Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            {/* Photo Section */}
            <div style={{
              backgroundColor: 'var(--nhlb-blush-light)',
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {counselor.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={counselor.photo_url}
                  alt={counselor.name}
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              ) : (
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  backgroundColor: 'var(--nhlb-red-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  <span style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '3rem',
                    color: 'var(--nhlb-red-dark)',
                  }}>
                    {counselor.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div style={{ padding: '32px 24px' }}>
              <h1 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 600,
                color: 'var(--nhlb-red-dark)',
                margin: '0 0 8px',
                textAlign: 'center',
              }}>
                {counselor.name}
              </h1>

              {counselor.title && (
                <p style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '1rem',
                  color: 'var(--nhlb-muted)',
                  margin: '0 0 20px',
                  textAlign: 'center',
                  fontWeight: 500,
                }}>
                  {counselor.title}
                </p>
              )}

              {counselor.specialties && counselor.specialties.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  {counselor.specialties.map((specialty, i) => (
                    <span key={i} style={{
                      backgroundColor: 'var(--nhlb-blush-light)',
                      color: 'var(--nhlb-red-dark)',
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: 20,
                    }}>
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              {counselor.bio && (
                <div style={{
                  backgroundColor: 'var(--nhlb-cream)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  marginBottom: 24,
                }}>
                  <p style={{
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '0.95rem',
                    lineHeight: 1.8,
                    color: 'var(--nhlb-text)',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {counselor.bio}
                  </p>
                </div>
              )}

              {/* Book Button */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Link
                  href={`/book/new?counselorId=${counselor.id}`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'var(--nhlb-red)',
                    color: 'white',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.03em',
                    padding: '14px 40px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(139, 69, 90, 0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  Book a Session with {counselor.name.split(' ')[0]}
                </Link>
              </div>

              {/* Share Panel */}
              <SharePanel
                url={profileUrl}
                title={`Book a session with ${counselor.name} at No Heart Left Behind`}
                description={counselor.bio || `Schedule a counseling session with ${counselor.name}.`}
                label="Share this profile"
              />
            </div>
          </div>

          {/* Back Link */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/book" style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '0.85rem',
              color: 'var(--nhlb-muted)',
              textDecoration: 'underline',
            }}>
              ← Back to Booking
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Header() {
  return (
    <>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)',
        color: 'white',
        textAlign: 'center',
        fontSize: '0.8rem',
        letterSpacing: '0.05em',
        padding: '8px 16px',
        fontFamily: 'Raleway, sans-serif',
      }}>
        Let&apos;s Build Hope &amp; Healing TOGETHER!
      </div>

      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 80,
      }}>
        <a
          href="https://www.noheartleftbehind.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <span style={{
            display: 'inline-flex',
            backgroundColor: 'var(--nhlb-red-dark)',
            borderRadius: 10,
            padding: '10px 16px',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-white.png"
              alt="No Heart Left Behind"
              style={{ height: 34, width: 'auto', display: 'block' }}
            />
          </span>
        </a>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/book" style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '0.85rem',
            color: 'var(--nhlb-text)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Book a Session
          </Link>
          <a
            href="https://www.noheartleftbehind.com/donate"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: 'var(--nhlb-red)',
              color: 'white',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              padding: '8px 20px',
              borderRadius: 4,
              textDecoration: 'none',
            }}
          >
            Donate
          </a>
        </div>
      </header>
    </>
  )
}

function Footer() {
  return (
    <footer style={{
      backgroundColor: 'white',
      borderTop: '1px solid var(--nhlb-blush-light)',
      padding: '24px 40px',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'Raleway, sans-serif',
        fontSize: '0.8rem',
        color: 'var(--nhlb-muted)',
        margin: 0,
      }}>
        © {new Date().getFullYear()} No Heart Left Behind. All rights reserved.
      </p>
    </footer>
  )
}
