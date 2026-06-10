'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface SharePanelProps {
  url: string
  title: string
  description?: string
  compact?: boolean
  label?: string
}

export default function SharePanel({ url, title, description, compact, label = 'Share this page' }: SharePanelProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description || title)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, { width: 200, margin: 2 }).then(dataUrl => {
      if (!cancelled) setQrDataUrl(dataUrl)
    })
    return () => { cancelled = true }
  }, [url])

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank')
  }

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, '_blank')
  }

  const emailLink = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${description || title}\n\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const smsLink = () => {
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

  const pad = compact ? '12px 16px' : '16px 20px'
  const btnStyle: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 6,
    border: '1px solid var(--nhlb-border)',
    background: 'white',
    cursor: 'pointer',
    fontFamily: 'Raleway, sans-serif',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--nhlb-text)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    <div style={{
      background: 'var(--nhlb-cream)',
      borderRadius: 10,
      padding: pad,
      border: '1px solid var(--nhlb-border)',
    }}>
      <p style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--nhlb-text)',
        margin: '0 0 8px',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'Raleway, sans-serif',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--nhlb-red-dark)',
        margin: '0 0 12px',
        wordBreak: 'break-all',
      }}>
        {url}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={copyLink} style={btnStyle}>
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        <button onClick={emailLink} style={btnStyle}>
          ✉️ Email
        </button>
        <button onClick={smsLink} style={btnStyle}>
          💬 Text
        </button>
        <button onClick={shareFacebook} style={btnStyle}>
          f Facebook
        </button>
        <button onClick={shareTwitter} style={btnStyle}>
          𝕏 Twitter
        </button>
        <button onClick={() => setShowQr(v => !v)} style={btnStyle}>
          ⬡ QR Code
        </button>
      </div>
      {showQr && qrDataUrl && (
        <div style={{ marginTop: 16, textAlign: compact ? 'left' : 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR code"
            style={{
              width: compact ? 140 : 180,
              height: compact ? 140 : 180,
              borderRadius: 8,
              border: '1px solid var(--nhlb-border)',
              background: 'white',
            }}
          />
          <p style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: '0.75rem',
            color: 'var(--nhlb-muted)',
            marginTop: 8,
          }}>
            Scan to visit this page
          </p>
        </div>
      )}
    </div>
  )
}
