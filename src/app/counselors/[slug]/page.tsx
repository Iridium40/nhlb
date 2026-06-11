'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const slug = params?.slug as string

  const [counselor, setCounselor] = useState<CounselorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

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

              {/* Appointment Button */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <button
                  onClick={() => setShowBookingModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: 'var(--nhlb-red-dark)',
                    color: 'white',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.03em',
                    padding: '14px 32px',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139, 69, 90, 0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  Schedule an Appointment with {counselor.name.split(' ')[0]}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M9 16l2 2 4-4" />
                  </svg>
                </button>
              </div>

              {/* Booking Choice Modal */}
              {showBookingModal && (
                <div
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20,
                  }}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 16,
                      width: '100%',
                      maxWidth: 400,
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Modal Header */}
                    <div style={{
                      backgroundColor: 'var(--nhlb-red-dark)',
                      padding: '20px 24px',
                      textAlign: 'center',
                    }}>
                      <h3 style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'white',
                        margin: 0,
                      }}>
                        Schedule with {counselor.name.split(' ')[0]}
                      </h3>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: 24 }}>
                      <p style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '0.95rem',
                        color: 'var(--nhlb-muted)',
                        textAlign: 'center',
                        margin: '0 0 24px',
                      }}>
                        Have you visited us before?
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button
                          onClick={() => router.push(`/book/new?counselorId=${counselor.id}`)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '16px 20px',
                            backgroundColor: 'var(--nhlb-red)',
                            color: 'white',
                            fontFamily: 'Raleway, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            border: 'none',
                            borderRadius: 9999,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          I&apos;m a New Client
                          <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>
                            First visit with No Heart Left Behind
                          </span>
                        </button>

                        <button
                          onClick={() => router.push(`/book?signin=true&counselorId=${counselor.id}`)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '16px 20px',
                            backgroundColor: 'var(--nhlb-cream)',
                            color: 'var(--nhlb-red-dark)',
                            fontFamily: 'Raleway, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            border: '2px solid var(--nhlb-border)',
                            borderRadius: 9999,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          I&apos;m a Returning Client
                          <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', color: 'var(--nhlb-muted)', marginTop: 4 }}>
                            Sign in to book
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowBookingModal(false)}
                        style={{
                          display: 'block',
                          width: '100%',
                          marginTop: 16,
                          padding: '12px',
                          background: 'none',
                          border: 'none',
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: '0.85rem',
                          color: 'var(--nhlb-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Share Button */}
              <div style={{ textAlign: 'center' }}>
                <SharePanel
                  url={profileUrl}
                  title={`Book a session with ${counselor.name} at No Heart Left Behind`}
                  description={counselor.bio || `Schedule a counseling session with ${counselor.name}.`}
                  profileName={counselor.name}
                />
              </div>
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--nhlb-cream)',
            color: 'var(--nhlb-red-dark)',
            fontFamily: 'Raleway, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '10px 24px',
            borderRadius: 9999,
            textDecoration: 'none',
          }}>
            Schedule Appointment
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M9 16l2 2 4-4" />
            </svg>
          </Link>
          <a
            href="https://www.noheartleftbehind.com/donate"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--nhlb-red)',
              color: 'white',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              padding: '10px 24px',
              borderRadius: 9999,
              textDecoration: 'none',
            }}
          >
            Donate
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
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
