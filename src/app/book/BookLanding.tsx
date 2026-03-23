'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Client } from '@/types'

type View = 'loading' | 'guest' | 'signin' | 'loggedIn'

export default function BookLanding() {
  const router = useRouter()
  const [view, setView] = useState<View>('loading')
  const [client, setClient] = useState<Client | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/client-session')
      const json = await res.json()
      if (json.client) {
        setClient(json.client)
        setView('loggedIn')
      } else {
        setView('guest')
      }
    } catch {
      setView('guest')
    }
  }, [])

  useEffect(() => { checkSession() }, [checkSession])

  const handleSignIn = async () => {
    if (!loginEmail || !loginPassword) { setLoginError('Please enter your email and password.'); return }
    setLoggingIn(true)
    setLoginError(null)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword })

    if (error) {
      setLoginError(error.message)
      setLoggingIn(false)
      return
    }

    const res = await fetch('/api/auth/client-session')
    const json = await res.json()

    if (!json.client) {
      setLoginError('No client account found for this email. You may need to book as a new client first.')
      await supabase.auth.signOut()
      setLoggingIn(false)
      return
    }

    setClient(json.client)
    setView('loggedIn')
    setLoggingIn(false)
  }

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setClient(null)
    setView('guest')
  }

  const S = {
    input: {
      width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
      padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
      color: 'var(--nhlb-text)', background: 'white', outline: 'none',
      boxSizing: 'border-box' as const,
    },
    label: {
      display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
      color: 'var(--nhlb-muted)', marginBottom: 6,
    },
  }

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
        backgroundColor: 'white',
        borderBottom: '1px solid var(--nhlb-blush-light)',
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {view === 'loggedIn' && client && (
            <button onClick={handleSignOut} style={{
              background: 'none', border: 'none', fontFamily: 'Lato, sans-serif',
              fontSize: '0.8rem', color: 'var(--nhlb-muted)', cursor: 'pointer',
              textDecoration: 'underline',
            }}>
              Sign Out
            </button>
          )}
          <a href="https://www.noheartleftbehind.com/donate" target="_blank" rel="noopener noreferrer"
            style={{
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              letterSpacing: '0.06em', padding: '8px 20px', borderRadius: 4,
              textDecoration: 'none',
            }}>
            Donate
          </a>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
          }}>
            Book a Counseling Session
          </h1>
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '1rem', lineHeight: 1.7,
            color: 'var(--nhlb-muted)', margin: '0 0 40px',
          }}>
            Affordable, faith-based counseling for individuals, couples, and families.<br />
            430 N. Jefferson Ave, Covington, LA
          </p>

          {view === 'loading' && (
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', padding: '20px 0' }}>
              Loading...
            </p>
          )}

          {/* Logged-in client */}
          {view === 'loggedIn' && client && (
            <div>
              <div style={{
                background: '#EAF5EE', border: '1px solid #BBF7D0',
                borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
                  fontWeight: 600, color: '#065F46', margin: '0 0 4px',
                }}>
                  Welcome back, {client.first_name}!
                </p>
                <p style={{
                  fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
                  color: '#065F46', margin: 0, opacity: 0.8,
                }}>
                  Signed in as {client.email}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => router.push('/book/returning?auto=1')} style={{
                  display: 'block', width: '100%', padding: '20px 24px',
                  backgroundColor: 'var(--nhlb-red)', color: 'white',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1rem',
                  letterSpacing: '0.04em', borderRadius: 12, border: 'none',
                  cursor: 'pointer',
                }}>
                  Book a Session
                  <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>
                    In-person or virtual
                  </span>
                </button>

                <button onClick={() => router.push('/book/my-sessions')} style={{
                  display: 'block', width: '100%', padding: '16px 24px',
                  backgroundColor: 'white', color: 'var(--nhlb-red-dark)',
                  border: '2px solid var(--nhlb-border)',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.95rem',
                  letterSpacing: '0.04em', borderRadius: 12, cursor: 'pointer',
                }}>
                  My Sessions
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button onClick={() => router.push('/book/profile')} style={{
                    padding: '14px 16px',
                    backgroundColor: 'white', color: 'var(--nhlb-text)',
                    border: '1px solid var(--nhlb-border)',
                    fontFamily: 'Lato, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                    borderRadius: 10, cursor: 'pointer',
                  }}>
                    My Profile
                  </button>
                  <button onClick={() => router.push('/book/payment-methods')} style={{
                    padding: '14px 16px',
                    backgroundColor: 'white', color: 'var(--nhlb-text)',
                    border: '1px solid var(--nhlb-border)',
                    fontFamily: 'Lato, sans-serif', fontWeight: 600, fontSize: '0.85rem',
                    borderRadius: 10, cursor: 'pointer',
                  }}>
                    Payment Methods
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guest: not logged in */}
          {view === 'guest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link href="/book/new" style={{
                display: 'block', padding: '20px 24px',
                backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1rem',
                letterSpacing: '0.04em', borderRadius: 12, textDecoration: 'none',
              }}>
                I&apos;m a New Client
                <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>
                  First visit &mdash; in-person only
                </span>
              </Link>

              <button onClick={() => setView('signin')} style={{
                display: 'block', width: '100%', padding: '20px 24px',
                backgroundColor: 'white', color: 'var(--nhlb-red-dark)',
                border: '2px solid var(--nhlb-border)',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1rem',
                letterSpacing: '0.04em', borderRadius: 12, cursor: 'pointer',
                textAlign: 'center',
              }}>
                Returning Client? Sign In
                <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', color: 'var(--nhlb-muted)', marginTop: 4 }}>
                  In-person or virtual
                </span>
              </button>
            </div>
          )}

          {/* Sign-in form */}
          {view === 'signin' && (
            <div>
              <div style={{
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 12, padding: '28px', textAlign: 'left',
              }}>
                <h2 style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
                  fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 20px',
                  textAlign: 'center',
                }}>
                  Client Sign In
                </h2>

                {loginError && (
                  <div style={{
                    marginBottom: 16, padding: '12px 14px',
                    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
                  }}>
                    {loginError}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Email</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                    style={S.input} placeholder="jane@example.com" />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={S.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                      style={{ ...S.input, paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: 'var(--nhlb-muted)',
                    }} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPw ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <button onClick={handleSignIn} disabled={loggingIn} style={{
                  width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none',
                  backgroundColor: 'var(--nhlb-red)', color: 'white',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                  cursor: 'pointer', opacity: loggingIn ? 0.6 : 1,
                }}>
                  {loggingIn ? 'Signing in...' : 'Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <Link href="/book/forgot-password" style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
                    color: 'var(--nhlb-red)', textDecoration: 'none',
                  }}>
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <button onClick={() => { setView('guest'); setLoginError(null) }} style={{
                background: 'none', border: 'none', fontFamily: 'Lato, sans-serif',
                fontSize: '0.875rem', color: 'var(--nhlb-muted)', cursor: 'pointer',
                padding: '12px 0', margin: '0 auto', display: 'block',
              }}>
                &larr; Back
              </button>
            </div>
          )}

          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '1rem', color: 'var(--nhlb-muted)', marginTop: 48,
          }}>
            &ldquo;As a man thinks in his heart, so is he.&rdquo;<br />
            <span style={{ fontSize: '0.85rem' }}>&mdash; Proverbs 23:7</span>
          </p>
        </div>
      </main>

      <footer style={{ backgroundColor: 'var(--nhlb-blush)', padding: '24px 48px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', margin: 0 }}>
          No Heart Left Behind &copy; {new Date().getFullYear()} &ensp;&middot;&ensp; 985-264-8808 &ensp;&middot;&ensp; reconnectus@yahoo.com
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/counselor/login" style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            Counselor Login
          </Link>
          <Link href="/admin/bookings" style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            Admin
          </Link>
        </div>
      </footer>
    </div>
  )
}
