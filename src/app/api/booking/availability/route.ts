import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { addDays, startOfDay, endOfDay, addHours, setHours, setMinutes, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supabase = createSupabaseAdminClient()

  // Admin bookings list mode
  if (searchParams.get('admin') === 'true') {
    const status = searchParams.get('status') ?? 'all'
    const query = supabase
      .from('bookings')
      .select('*, client:clients(*), counselor:counselors(id, name, title)')
      .order('scheduled_at', { ascending: true })
    if (status !== 'all') query.eq('status', status)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ bookings: data })
  }

  // Public availability: generate 1hr slots from counselor availability windows
  const counselorId = searchParams.get('counselorId')
  const isNewClient = searchParams.get('newClient') === 'true'

  const now = new Date()
  const minBookingTime = isNewClient ? addHours(now, 24) : addHours(now, 1)
  const rangeEnd = endOfDay(addDays(now, 14))

  // Get available counselors + their windows
  let counselorQuery = supabase
    .from('counselors')
    .select('id, name, photo_url')
    .eq('is_active', true)
  if (counselorId) counselorQuery = counselorQuery.eq('id', counselorId)
  const { data: counselors } = await counselorQuery
  if (!counselors?.length) return NextResponse.json({ slots: [] })

  const ids = counselors.map(c => c.id)
  const { data: windows } = await supabase
    .from('availability_slots')
    .select('*')
    .in('counselor_id', ids)
    .eq('is_active', true)

  // Get already-booked slots
  const { data: booked } = await supabase
    .from('bookings')
    .select('counselor_id, scheduled_at')
    .in('counselor_id', ids)
    .neq('status', 'CANCELLED')
    .gte('scheduled_at', startOfDay(now).toISOString())
    .lte('scheduled_at', rangeEnd.toISOString())

  const bookedSet = new Set(
    (booked ?? []).map(b => `${b.counselor_id}_${b.scheduled_at}`)
  )

  // Get blocked dates
  const { data: blocked } = await supabase
    .from('counselor_blocked_dates')
    .select('counselor_id, blocked_date, start_time, end_time')
    .in('counselor_id', ids)
    .gte('blocked_date', format(startOfDay(now), 'yyyy-MM-dd'))
    .lte('blocked_date', format(rangeEnd, 'yyyy-MM-dd'))

  const isBlocked = (counselorId: string, date: Date, hour: number): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return (blocked ?? []).some(b => {
      if (b.counselor_id !== counselorId || b.blocked_date !== dateStr) return false
      if (!b.start_time && !b.end_time) return true
      const bStart = b.start_time ? parseInt(b.start_time.split(':')[0]) : 0
      const bEnd = b.end_time ? parseInt(b.end_time.split(':')[0]) : 24
      return hour >= bStart && hour < bEnd
    })
  }

  // Business hours: never offer slots outside this range regardless of availability_slots data
  const BUSINESS_HOUR_START = 9  // 9 AM
  const BUSINESS_HOUR_END = 17   // 5 PM

  // Generate 1hr slots for next 14 days
  const slots: { start: string; counselorId: string; counselorName: string; counselorPhotoUrl: string | null }[] = []
  const counselorMap = Object.fromEntries(counselors.map(c => [c.id, { name: c.name, photo_url: c.photo_url }]))

  for (let d = 0; d <= 14; d++) {
    const day = addDays(now, d)
    const dow = day.getDay()

    for (const w of windows ?? []) {
      if (w.day_of_week !== dow) continue

      const startHour = Math.max(parseInt(w.start_time.split(':')[0]), BUSINESS_HOUR_START)
      const endHour = Math.min(parseInt(w.end_time.split(':')[0]), BUSINESS_HOUR_END)

      for (let h = startHour; h < endHour; h++) {
        const slotTime = setMinutes(setHours(startOfDay(day), h), 0)
        if (slotTime < minBookingTime) continue
        if (slotTime > rangeEnd) continue

        const iso = slotTime.toISOString()
        const key = `${w.counselor_id}_${iso}`
        if (bookedSet.has(key)) continue
        if (isBlocked(w.counselor_id, day, h)) continue

        slots.push({
          start: iso,
          counselorId: w.counselor_id,
          counselorName: counselorMap[w.counselor_id]?.name ?? '',
          counselorPhotoUrl: counselorMap[w.counselor_id]?.photo_url ?? null,
        })
      }
    }
  }

  slots.sort((a, b) => a.start.localeCompare(b.start))
  return NextResponse.json({ slots })
}
