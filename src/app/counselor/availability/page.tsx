'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import type { CounselorAvailability, CounselorBlockedDate } from '@/types'
import CounselorNav from '@/components/counselor/CounselorNav'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 7
  return { value: `${String(h).padStart(2, '0')}:00`, label: `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}` }
})

const S = {
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 4,
  } as React.CSSProperties,
  input: {
    border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
}

export default function CounselorAvailabilityPage() {
  const router = useRouter()
  const [counselorId, setCounselorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Recurring availability
  const [slots, setSlots] = useState<CounselorAvailability[]>([])
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('17:00')
  const [savingSlot, setSavingSlot] = useState(false)

  // Blocked dates
  const [blockedDates, setBlockedDates] = useState<CounselorBlockedDate[]>([])
  const [blockDate, setBlockDate] = useState('')
  const [blockStartTime, setBlockStartTime] = useState('')
  const [blockEndTime, setBlockEndTime] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockFullDay, setBlockFullDay] = useState(true)
  const [savingBlock, setSavingBlock] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const meRes = await fetch('/api/counselor/me')
    if (!meRes.ok) { router.push('/counselor/login'); return }
    const meJson = await meRes.json()
    setCounselorId(meJson.counselor.id)

    const [slotsRes, blockedRes] = await Promise.all([
      fetch(`/api/counselors/${meJson.counselor.id}/availability`),
      fetch('/api/counselor/blocked-dates'),
    ])
    const slotsJson = await slotsRes.json()
    const blockedJson = await blockedRes.json()
    setSlots(slotsJson.slots ?? [])
    setBlockedDates(blockedJson.blockedDates ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const addSlot = async () => {
    if (!counselorId) return
    setSavingSlot(true)
    await fetch(`/api/counselors/${counselorId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: newDay, start_time: newStart, end_time: newEnd }),
    })
    await load()
    setSavingSlot(false)
  }

  const removeSlot = async (slotId: string) => {
    if (!counselorId) return
    await fetch(`/api/counselors/${counselorId}/availability`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    })
    load()
  }

  const addBlockedDate = async () => {
    if (!blockDate) return
    setSavingBlock(true)
    await fetch('/api/counselor/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocked_date: blockDate,
        start_time: blockFullDay ? null : blockStartTime || null,
        end_time: blockFullDay ? null : blockEndTime || null,
        reason: blockReason || null,
      }),
    })
    setBlockDate('')
    setBlockReason('')
    setBlockStartTime('')
    setBlockEndTime('')
    await load()
    setSavingBlock(false)
  }

  const removeBlockedDate = async (id: string) => {
    await fetch('/api/counselor/blocked-dates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  const grouped = DAYS.map((day, i) => ({
    day,
    dayNum: i,
    windows: slots.filter(s => s.day_of_week === i),
  })).filter(g => g.windows.length > 0)

  // Quick add buttons for next 14 days
  const quickDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <CounselorNav />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Recurring weekly hours ── */}
        <div style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '24px', marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 16px',
          }}>Weekly Hours</h2>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', marginBottom: 16 }}>
            These are your recurring availability windows. Clients will see 1-hour slots within these times.
          </p>

          {grouped.length === 0 ? (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', fontStyle: 'italic', marginBottom: 16 }}>
              No recurring hours set yet.
            </p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {grouped.map(g => (
                <div key={g.dayNum} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 0', borderBottom: '1px solid var(--nhlb-border)',
                }}>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--nhlb-text)', minWidth: 90 }}>
                    {g.day}
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                    {g.windows.map(w => (
                      <div key={w.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 20,
                        backgroundColor: 'var(--nhlb-cream-dark)',
                      }}>
                        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)' }}>
                          {w.start_time.slice(0, 5)} &ndash; {w.end_time.slice(0, 5)}
                        </span>
                        <button onClick={() => removeSlot(w.id)} style={{
                          background: 'none', border: 'none', color: '#DC2626',
                          cursor: 'pointer', fontSize: '0.9rem', padding: 0, lineHeight: 1,
                        }}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <label style={S.label}>Day</label>
              <select value={newDay} onChange={e => setNewDay(Number(e.target.value))} style={{ ...S.input, width: 130 }}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Start</label>
              <select value={newStart} onChange={e => setNewStart(e.target.value)} style={{ ...S.input, width: 100 }}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>End</label>
              <select value={newEnd} onChange={e => setNewEnd(e.target.value)} style={{ ...S.input, width: 100 }}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <button onClick={addSlot} disabled={savingSlot} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              opacity: savingSlot ? 0.6 : 1,
            }}>
              {savingSlot ? 'Adding...' : '+ Add Hours'}
            </button>
          </div>
        </div>

        {/* ── Blocked dates / Time off ── */}
        <div style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '24px',
        }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 16px',
          }}>Time Off &amp; Blocked Dates</h2>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', marginBottom: 16 }}>
            Block specific dates when you&apos;re unavailable. Clients won&apos;t be able to book during these times.
          </p>

          {/* Current blocked dates */}
          {blockedDates.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {blockedDates.map(bd => (
                <div key={bd.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', marginBottom: 6,
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 8,
                }}>
                  <div>
                    <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#B91C1C' }}>
                      {format(new Date(bd.blocked_date + 'T12:00:00'), 'EEE, MMM d, yyyy')}
                    </span>
                    {bd.start_time && bd.end_time && (
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#B91C1C', marginLeft: 8 }}>
                        {bd.start_time.slice(0, 5)} &ndash; {bd.end_time.slice(0, 5)}
                      </span>
                    )}
                    {!bd.start_time && (
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#991B1B', marginLeft: 8 }}>
                        All day
                      </span>
                    )}
                    {bd.reason && (
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#B91C1C', marginLeft: 8, fontStyle: 'italic' }}>
                        &mdash; {bd.reason}
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeBlockedDate(bd.id)} style={{
                    background: 'none', border: 'none', color: '#DC2626',
                    cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                  }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Quick date picker */}
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Quick pick</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {quickDates.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const isSelected = blockDate === dateStr
                return (
                  <button key={dateStr} onClick={() => setBlockDate(dateStr)} style={{
                    padding: '4px 10px', borderRadius: 6,
                    border: `1px solid ${isSelected ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                    backgroundColor: isSelected ? 'var(--nhlb-red)' : 'white',
                    color: isSelected ? 'white' : 'var(--nhlb-muted)',
                    fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  }}>
                    {format(d, 'EEE d')}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} style={{ ...S.input, width: 160 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 4 }}>
              <input type="checkbox" checked={blockFullDay} onChange={e => setBlockFullDay(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--nhlb-red)' }} />
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem' }}>Full day</span>
            </label>
            {!blockFullDay && (
              <>
                <div>
                  <label style={S.label}>From</label>
                  <select value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} style={{ ...S.input, width: 100 }}>
                    <option value="">--</option>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>To</label>
                  <select value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} style={{ ...S.input, width: 100 }}>
                    <option value="">--</option>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={S.label}>Reason (optional)</label>
              <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                style={{ ...S.input, width: '100%' }} placeholder="Vacation, sick day, etc." />
            </div>
            <button onClick={addBlockedDate} disabled={savingBlock || !blockDate} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              backgroundColor: '#B91C1C', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              opacity: savingBlock || !blockDate ? 0.5 : 1,
            }}>
              {savingBlock ? 'Blocking...' : 'Block Date'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
