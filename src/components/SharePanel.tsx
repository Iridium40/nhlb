'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface SharePanelProps {
  url: string
  title: string
  description?: string
  profileName?: string
}

type Tab = 'link' | 'qr' | 'social'

export default function SharePanel({ url, title, description, profileName }: SharePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('link')
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [emailTo, setEmailTo] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    QRCode.toDataURL(url, { width: 280, margin: 2 }).then(dataUrl => {
      if (!cancelled) setQrDataUrl(dataUrl)
    })
    return () => { cancelled = true }
  }, [url, isOpen])

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = () => {
    if (!emailTo) return
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${description || title}\n\n${url}`)
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 2000)
  }

  const sendSMS = () => {
    const body = encodeURIComponent(`${title}: ${url}`)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = `sms:?body=${body}`
    } else {
      navigator.clipboard.writeText(`${title}: ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank')
  }

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, '_blank')
  }

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, '_blank')
  }

  const modalTitle = profileName ? `Share ${profileName}'s Profile` : 'Share'

  return (
    <>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          backgroundColor: 'var(--nhlb-red-dark)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontFamily: 'Raleway, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
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
          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--nhlb-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--nhlb-red-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <h2 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--nhlb-text)',
                  margin: 0,
                }}>
                  {modalTitle}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: 'var(--nhlb-muted)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--nhlb-border)',
            }}>
              {(['link', 'qr', 'social'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: activeTab === tab ? 'var(--nhlb-cream)' : 'white',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--nhlb-red-dark)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: activeTab === tab ? 'var(--nhlb-red-dark)' : 'var(--nhlb-muted)',
                  }}
                >
                  {tab === 'link' ? 'Link' : tab === 'qr' ? 'QR Code' : 'Social'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: 24 }}>
              {activeTab === 'link' && (
                <div>
                  {/* Share Link */}
                  <label style={{
                    display: 'block',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--nhlb-text)',
                    marginBottom: 8,
                  }}>
                    Share Link
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input
                      type="text"
                      value={url}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid var(--nhlb-border)',
                        borderRadius: 8,
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '0.85rem',
                        color: 'var(--nhlb-text)',
                        background: 'var(--nhlb-cream)',
                      }}
                    />
                    <button
                      onClick={copyLink}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        backgroundColor: 'var(--nhlb-red-dark)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Email */}
                  <label style={{
                    display: 'block',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--nhlb-text)',
                    marginBottom: 8,
                  }}>
                    Send via Email (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="recipient@example.com"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid var(--nhlb-border)',
                        borderRadius: 8,
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '0.85rem',
                        color: 'var(--nhlb-text)',
                        background: 'white',
                      }}
                    />
                    <button
                      onClick={sendEmail}
                      disabled={!emailTo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        backgroundColor: emailTo ? 'var(--nhlb-red-dark)' : 'var(--nhlb-border)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: emailTo ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {emailSent ? 'Sent!' : 'Send'}
                    </button>
                  </div>

                  {/* SMS Button */}
                  <button
                    onClick={sendSMS}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: 'var(--nhlb-text)',
                      border: '1px solid var(--nhlb-border)',
                      borderRadius: 8,
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Send SMS
                  </button>
                </div>
              )}

              {activeTab === 'qr' && (
                <div style={{ textAlign: 'center' }}>
                  {qrDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="QR code"
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: 12,
                          border: '1px solid var(--nhlb-border)',
                          marginBottom: 16,
                        }}
                      />
                      <p style={{
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '0.85rem',
                        color: 'var(--nhlb-muted)',
                        margin: 0,
                      }}>
                        Scan this code to visit the profile
                      </p>
                    </>
                  ) : (
                    <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--nhlb-muted)' }}>
                      Loading QR code...
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'social' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={shareFacebook}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      backgroundColor: '#1877F2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Share on Facebook
                  </button>
                  <button
                    onClick={shareTwitter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      backgroundColor: '#000000',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X (Twitter)
                  </button>
                  <button
                    onClick={shareLinkedIn}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      backgroundColor: '#0A66C2',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Share on LinkedIn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
