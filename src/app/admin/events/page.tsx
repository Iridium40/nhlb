'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import QRCode from 'qrcode'
import type { Event } from '@/types'
import { generateSlug } from '@/lib/slug'
import AdminNav from '@/components/admin/AdminNav'

const BASE_URL = 'https://noheartleftbehind.com'

const S = {
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 4,
  } as React.CSSProperties,
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
  btn: (bg: string, color: string) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
    backgroundColor: bg, color, fontFamily: 'Lato, sans-serif',
    fontWeight: 700, fontSize: '0.8rem',
  } as React.CSSProperties),
}

function formatForInput(iso: string | null | undefined): string {
  if (!iso) return ''
  try { return format(new Date(iso), "yyyy-MM-dd'T'HH:mm") } catch { return '' }
}

function getBarColor(current: number, min?: number | null, max?: number | null): string {
  if (max != null && current >= max) return '#3B82F6'
  if (min != null && current < min) return '#EF4444'
  if (min != null && current >= min) {
    if (max != null && current >= max * 0.75) return '#10B981'
    return max != null ? '#F59E0B' : '#10B981'
  }
  if (max != null && current >= max * 0.75) return '#10B981'
  return '#94A3B8'
}

function getRegistrationStatus(ev: Event): { text: string; bg: string; color: string } {
  const count = ev.registration_count ?? 0
  if (ev.cancelled_at) return { text: '✕ Cancelled', bg: '#F3F4F6', color: '#6B7280' }
  if (ev.max_capacity && count >= ev.max_capacity) return { text: '● Full', bg: '#DBEAFE', color: '#1E40AF' }
  if (ev.min_capacity && count >= ev.min_capacity) return { text: '✓ Minimum met', bg: '#D1FAE5', color: '#065F46' }
  if (ev.min_capacity && count < ev.min_capacity) {
    const needed = ev.min_capacity - count
    const deadline = ev.cancellation_deadline
      ? format(new Date(ev.cancellation_deadline), 'MMM d, h:mm a')
      : ''
    return {
      text: `⚠ Below minimum — ${needed} needed${deadline ? ` by ${deadline}` : ''}`,
      bg: '#FEF3C7', color: '#92400E',
    }
  }
  const maxText = ev.max_capacity ? ` / ${ev.max_capacity}` : ''
  return { text: `${count}${maxText} registered`, bg: '#F3F4F6', color: '#6B7280' }
}

/* ── Photo upload/remove ── */

function EventPhotoControls({ event, onUpdated }: { event: Event; onUpdated: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/events/${event.id}/photo`, { method: 'POST', body: fd })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Upload failed')
    } else {
      onUpdated()
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleRemove = async () => {
    setUploading(true)
    setError(null)
    await fetch(`/api/events/${event.id}/photo`, { method: 'DELETE' })
    onUpdated()
    setUploading(false)
  }

  return (
    <div style={{ flexShrink: 0, textAlign: 'center' }}>
      <label style={{
        display: 'block', width: 80, height: 56, borderRadius: 8, overflow: 'hidden',
        cursor: uploading ? 'default' : 'pointer', border: '1px solid var(--nhlb-border)',
        background: 'var(--nhlb-cream)',
      }}>
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.4rem', color: 'var(--nhlb-muted)' }}>🖼</span>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
      </label>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
        <label style={{ fontSize: '0.65rem', color: 'var(--nhlb-red)', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
          {uploading ? '...' : event.image_url ? 'Change' : 'Upload'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
        {event.image_url && (
          <button onClick={handleRemove} disabled={uploading} style={{
            background: 'none', border: 'none', padding: 0, fontSize: '0.65rem',
            color: '#DC2626', cursor: 'pointer', fontFamily: 'Lato, sans-serif',
          }}>Remove</button>
        )}
      </div>
      {error && <p style={{ fontSize: '0.6rem', color: '#DC2626', margin: '2px 0 0', fontFamily: 'Lato, sans-serif' }}>{error}</p>}
    </div>
  )
}

/* ── Attendance progress bar ── */

function AttendanceMeter({ current, min, max, compact }: {
  current: number; min?: number | null; max?: number | null; compact?: boolean
}) {
  const upperBound = max || Math.max((min || 0) * 2, Math.ceil(current * 1.5), 10)
  const pct = Math.min((current / upperBound) * 100, 100)
  const barColor = getBarColor(current, min, max)
  const barH = compact ? 4 : 8
  const minPct = min ? Math.min((min / upperBound) * 100, 100) : null

  return (
    <div>
      {!compact && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', margin: '0 0 6px', fontWeight: 600 }}>
          Current registrations: {current}
        </p>
      )}
      <div style={{ position: 'relative', height: barH, background: '#E5E7EB', borderRadius: barH / 2, overflow: 'visible' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: barH / 2, transition: 'width 0.3s' }} />
        {minPct != null && (
          <div style={{
            position: 'absolute', left: `${minPct}%`, top: -2, bottom: -2,
            width: 2, backgroundColor: '#6B7280', borderRadius: 1,
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', color: 'var(--nhlb-muted)' }}>
          {min ? `Min: ${min}` : ''}
        </span>
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', color: 'var(--nhlb-muted)' }}>
          {max ? `Max: ${max}` : ''}
        </span>
      </div>
    </div>
  )
}

/* ── Share panel ── */

function SharePanel({ slug, title, compact }: { slug: string; title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  const url = `${BASE_URL}/events/${slug}`
  const encoded = encodeURIComponent(url)

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

  const openPage = () => window.open(`/events/${slug}`, '_blank')
  const previewSocial = () => window.open(`https://developers.facebook.com/tools/debug/?q=${encoded}`, '_blank')
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank')
  const emailLink = () => {
    const subject = encodeURIComponent(`Join us: ${title}`)
    const body = encodeURIComponent(`Register for ${title} here:\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const pad = compact ? '12px 16px' : '16px 20px'
  const btnStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
    background: 'white', cursor: 'pointer', fontFamily: 'Lato, sans-serif',
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--nhlb-text)',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }

  return (
    <div style={{
      background: 'var(--nhlb-cream)', borderRadius: 10, padding: pad,
      border: '1px solid var(--nhlb-border)', marginTop: compact ? 12 : 16,
    }}>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
        Your event page is live at:
      </p>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--nhlb-red-dark)', margin: '0 0 12px', wordBreak: 'break-all' }}>
        {url}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button onClick={copyLink} style={btnStyle}>{copied ? '✓ Copied!' : '📋 Copy link'}</button>
        <button onClick={openPage} style={btnStyle}>↗ Open page</button>
        <button onClick={previewSocial} style={btnStyle}>🔍 Preview social card</button>
        <button onClick={shareFacebook} style={btnStyle}>f Facebook</button>
        <button onClick={emailLink} style={btnStyle}>✉ Email</button>
        <button onClick={() => setShowQr(v => !v)} style={btnStyle}>⬡ QR Code</button>
      </div>
      {showQr && qrDataUrl && (
        <div style={{ marginTop: 12, textAlign: compact ? 'left' : 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code" style={{ width: compact ? 120 : 160, height: compact ? 120 : 160, borderRadius: 8, border: '1px solid var(--nhlb-border)' }} />
        </div>
      )}
    </div>
  )
}

/* ── Event form (create / edit) ── */

function EventForm({ event, onSaved, onCancel }: {
  event?: Event
  onSaved: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [slug, setSlug] = useState(event?.slug ?? '')
  const slugManuallyEdited = useRef(!!event?.slug)
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventDate, setEventDate] = useState(
    event ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : '',
  )
  const [endDate, setEndDate] = useState(
    event?.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
  )
  const [location, setLocation] = useState(event?.location ?? '')
  const [feeCents, setFeeCents] = useState(event ? String(event.registration_fee_cents / 100) : '0')
  const [feeLabel, setFeeLabel] = useState(event?.fee_label ?? 'Registration Fee')
  const [maxCapacity, setMaxCapacity] = useState(event?.max_capacity ? String(event.max_capacity) : '')
  const [minCapacity, setMinCapacity] = useState(event?.min_capacity ? String(event.min_capacity) : '')
  const [isPublished, setIsPublished] = useState(event?.is_published ?? event?.is_active ?? true)
  const [registrationOpensAt, setRegistrationOpensAt] = useState(formatForInput(event?.registration_opens_at))
  const [registrationClosesAt, setRegistrationClosesAt] = useState(formatForInput(event?.registration_closes_at))
  const [cancellationDeadline, setCancellationDeadline] = useState(formatForInput(event?.cancellation_deadline))
  const deadlineManuallySet = useRef(!!event?.cancellation_deadline)
  const [cancellationReason, setCancellationReason] = useState(
    event?.cancellation_reason
      ?? 'Unfortunately, this event did not reach the minimum number of registrations needed to proceed.',
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugManuallyEdited.current) setSlug(generateSlug(title))
  }, [title])

  useEffect(() => {
    if (minCapacity && eventDate && !deadlineManuallySet.current) {
      const dt = new Date(eventDate)
      dt.setHours(dt.getHours() - 48)
      setCancellationDeadline(format(dt, "yyyy-MM-dd'T'HH:mm"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minCapacity, eventDate])

  const handleSlugChange = (val: string) => {
    slugManuallyEdited.current = true
    setSlug(val)
  }

  const handleDeadlineChange = (val: string) => {
    deadlineManuallySet.current = true
    setCancellationDeadline(val)
  }

  const save = async () => {
    if (!title || !eventDate) return
    setSaving(true)
    setSaveError(null)
    const payload = {
      title,
      description: description || null,
      event_date: new Date(eventDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      location: location || null,
      registration_fee_cents: Math.round(parseFloat(feeCents || '0') * 100),
      fee_label: feeLabel || 'Registration Fee',
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      is_active: isPublished,
      is_published: isPublished,
      slug: slug || null,
      registration_opens_at: registrationOpensAt ? new Date(registrationOpensAt).toISOString() : null,
      registration_closes_at: registrationClosesAt ? new Date(registrationClosesAt).toISOString() : null,
      min_capacity: minCapacity ? parseInt(minCapacity) : null,
      cancellation_deadline: cancellationDeadline ? new Date(cancellationDeadline).toISOString() : null,
      cancellation_reason: cancellationReason || null,
    }
    const apiUrl = event ? `/api/events/${event.id}` : '/api/events'
    const res = await fetch(apiUrl, {
      method: event ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setSaveError(json.error ?? 'Save failed')
      return
    }
    setSaved(true)
  }

  const regCount = event?.registration_count ?? 0
  const showMeter = !!event && regCount > 0

  return (
    <div style={{
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 12, padding: '24px', marginBottom: 16,
    }}>
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Title *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={S.input} />
      </div>

      {/* Slug */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Slug</label>
        <input
          value={slug}
          onChange={e => handleSlugChange(e.target.value)}
          style={S.input}
          placeholder="auto-generated-from-title"
        />
        {slug && (
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)',
            margin: '4px 0 0', wordBreak: 'break-all',
          }}>
            {BASE_URL}/events/{slug}
          </p>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ ...S.input, resize: 'none' }}
          rows={3}
        />
      </div>

      {/* Start / End dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={S.label}>Start date/time *</label>
          <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={S.input} />
        </div>
        <div>
          <label style={S.label}>End date/time</label>
          <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.input} />
        </div>
      </div>

      {/* Location */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Location</label>
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={S.input}
          placeholder="430 N. Jefferson Ave, Covington, LA"
        />
      </div>

      {/* Fee / Fee label / Max capacity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={S.label}>Fee ($)</label>
          <input type="number" min="0" step="0.01" value={feeCents} onChange={e => setFeeCents(e.target.value)} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Fee label</label>
          <input value={feeLabel} onChange={e => setFeeLabel(e.target.value)} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Max capacity</label>
          <input type="number" min="0" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} style={S.input} placeholder="Unlimited" />
        </div>
      </div>

      {/* Min capacity / Registration opens / Registration closes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={S.label}>Min attendees</label>
          <input type="number" min="0" value={minCapacity} onChange={e => setMinCapacity(e.target.value)} style={S.input} placeholder="Optional" />
        </div>
        <div>
          <label style={S.label}>Registration opens</label>
          <input type="datetime-local" value={registrationOpensAt} onChange={e => setRegistrationOpensAt(e.target.value)} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Registration closes</label>
          <input type="datetime-local" value={registrationClosesAt} onChange={e => setRegistrationClosesAt(e.target.value)} style={S.input} />
        </div>
      </div>

      {/* Cancellation deadline */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Cancellation deadline</label>
        <input
          type="datetime-local"
          value={cancellationDeadline}
          onChange={e => handleDeadlineChange(e.target.value)}
          style={S.input}
        />
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)',
          margin: '4px 0 0', fontStyle: 'italic',
        }}>
          If minimum is not met by this date/time, the event will be flagged for cancellation.
        </p>
      </div>

      {/* Cancellation reason */}
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Cancellation reason (shown to registrants if cancelled)</label>
        <textarea
          value={cancellationReason}
          onChange={e => setCancellationReason(e.target.value)}
          style={{ ...S.input, resize: 'none' }}
          rows={2}
        />
      </div>

      {/* Published toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
        <input
          type="checkbox"
          checked={isPublished}
          onChange={e => setIsPublished(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }}
        />
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem' }}>Published (visible to public)</span>
      </label>

      {/* Attendance meter */}
      {showMeter && (
        <div style={{ marginBottom: 20 }}>
          <AttendanceMeter
            current={regCount}
            min={event?.min_capacity}
            max={event?.max_capacity}
          />
        </div>
      )}

      {/* Error */}
      {saveError && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#DC2626', margin: '0 0 12px' }}>
          {saveError}
        </p>
      )}

      {/* Action buttons */}
      {!saved ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving || !title || !eventDate} style={S.btn('var(--nhlb-red)', 'white')}>
            {saving ? 'Saving...' : event ? 'Update' : 'Create Event'}
          </button>
          <button onClick={onCancel} style={S.btn('white', 'var(--nhlb-muted)')}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onSaved} style={S.btn('var(--nhlb-red)', 'white')}>Done</button>
        </div>
      )}

      {/* Share panel: visible when editing existing event with slug, or after save */}
      {slug && (saved || !!event) && (
        <SharePanel slug={slug} title={title} />
      )}
    </div>
  )
}

/* ── Main page ── */

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [shareExpandedId, setShareExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/events?all=true')
    const json = await res.json()
    setEvents(json.events ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button
            onClick={() => { setShowForm(true); setEditingId(null) }}
            style={S.btn('var(--nhlb-red)', 'white')}
          >
            + Create Event
          </button>
        </div>

        {showForm && !editingId && (
          <EventForm
            onSaved={() => { setShowForm(false); load() }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
            Loading...
          </p>
        ) : events.length === 0 ? (
          <p style={{
            textAlign: 'center', padding: '60px 0',
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)',
          }}>
            No events yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(ev => (
              editingId === ev.id ? (
                <EventForm
                  key={ev.id}
                  event={ev}
                  onSaved={() => { setEditingId(null); load() }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={ev.id} style={{
                  background: 'white', border: '1px solid var(--nhlb-border)',
                  borderRadius: 12, padding: '20px 24px',
                }}>
                  {/* Top row: photo + content */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <EventPhotoControls event={ev} onUpdated={load} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{
                          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem',
                          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
                        }}>
                          {ev.title}
                        </p>
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                          fontFamily: 'Lato, sans-serif',
                          backgroundColor: (ev.is_published ?? ev.is_active) ? '#D1FAE5' : '#FEE2E2',
                          color: (ev.is_published ?? ev.is_active) ? '#065F46' : '#991B1B',
                        }}>
                          {(ev.is_published ?? ev.is_active) ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      {/* Date + location */}
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', margin: '0 0 6px' }}>
                        📅 {format(new Date(ev.event_date), 'EEE, MMM d, yyyy h:mm a')}
                        {ev.location ? ` · 📍 ${ev.location}` : ''}
                      </p>

                      {/* Registration status */}
                      {(() => {
                        const status = getRegistrationStatus(ev)
                        return (
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 6,
                            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Lato, sans-serif',
                            backgroundColor: status.bg, color: status.color, marginBottom: 8,
                          }}>
                            {status.text}
                          </span>
                        )
                      })()}

                      {/* Progress bar */}
                      {(ev.min_capacity || ev.max_capacity) && (
                        <AttendanceMeter
                          current={ev.registration_count ?? 0}
                          min={ev.min_capacity}
                          max={ev.max_capacity}
                          compact
                        />
                      )}
                    </div>
                  </div>

                  {/* Action buttons row */}
                  <div style={{
                    display: 'flex', gap: 6, marginTop: 12,
                    justifyContent: 'flex-end', flexWrap: 'wrap',
                  }}>
                    <a href={`/admin/events/${ev.id}`} style={{
                      ...S.btn('var(--nhlb-cream-dark)', 'var(--nhlb-text)'),
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                    }}>Attendees</a>
                    <button onClick={() => setEditingId(ev.id)} style={S.btn('white', 'var(--nhlb-muted)')}>Edit</button>
                    {ev.slug && (
                      <button
                        onClick={() => setShareExpandedId(prev => prev === ev.id ? null : ev.id)}
                        style={{
                          ...S.btn(shareExpandedId === ev.id ? 'var(--nhlb-blush)' : 'white', 'var(--nhlb-text)'),
                          border: '1px solid var(--nhlb-border)',
                        }}
                      >
                        Share
                      </button>
                    )}
                    <a href={`/api/events/${ev.id}/registrations/export`} style={{
                      ...S.btn('white', 'var(--nhlb-muted)'),
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                      border: '1px solid var(--nhlb-border)',
                    }}>CSV ↓</a>
                    <button onClick={() => handleDelete(ev.id, ev.title)} style={S.btn('white', '#DC2626')}>Delete</button>
                  </div>

                  {/* Inline share panel */}
                  {shareExpandedId === ev.id && ev.slug && (
                    <SharePanel slug={ev.slug} title={ev.title} compact />
                  )}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
