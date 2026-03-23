import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/email'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      sourceBookingId,
      counselor_id,
      scheduled_at,
      session_format,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
    } = body

    if (!sourceBookingId || !counselor_id || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: source, error: srcErr } = await supabase
      .from('bookings')
      .select('*, client:clients(*), counselor:counselors(*)')
      .eq('id', sourceBookingId)
      .single()

    if (srcErr || !source) {
      return NextResponse.json({ error: 'Source booking not found' }, { status: 404 })
    }

    if (source.status !== 'completed') {
      return NextResponse.json({ error: 'Source session must be completed before scheduling the next' }, { status: 400 })
    }

    const parentId = source.parent_booking_id ?? source.id
    let nextIndex = (source.series_index ?? 1) + 1

    const dates: Date[] = []
    const firstDate = new Date(scheduled_at)
    dates.push(firstDate)

    if (is_recurring && recurrence_pattern && recurrence_end_date) {
      const intervals: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 }
      const interval = intervals[recurrence_pattern]
      if (!interval) {
        return NextResponse.json({ error: 'Invalid recurrence_pattern' }, { status: 400 })
      }

      const endDate = new Date(recurrence_end_date)
      let cursor = addDays(firstDate, interval)

      while (cursor <= endDate) {
        const day = cursor.getDay()
        if (day === 0) cursor = addDays(cursor, 1)
        else if (day === 6) cursor = addDays(cursor, 2)

        if (cursor <= endDate) {
          dates.push(new Date(cursor))
        }
        cursor = addDays(cursor, interval)
      }
    }

    const inserts = dates.map((d, i) => ({
      client_id: source.client_id,
      counselor_id,
      scheduled_at: d.toISOString(),
      type: session_format === 'virtual' ? 'VIRTUAL' : 'IN_PERSON',
      status: 'confirmed',
      duration_minutes: source.duration_minutes || 60,
      is_recurring: is_recurring ?? false,
      recurrence_pattern: is_recurring ? (recurrence_pattern ?? null) : null,
      recurrence_end_date: is_recurring ? (recurrence_end_date ?? null) : null,
      parent_booking_id: parentId,
      series_index: nextIndex + i,
      donation_amount_cents: 0,
    }))

    const { data: created, error: insErr } = await supabase
      .from('bookings')
      .insert(inserts)
      .select()

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    // Send confirmation email for the first new session only
    if (created?.[0] && source.client && source.counselor) {
      try {
        await sendBookingConfirmation({
          booking: created[0],
          counselor: source.counselor,
          client: source.client,
        })
      } catch {
        // Email failure should not block the response
      }
    }

    return NextResponse.json({
      created: created?.length ?? 0,
      bookings: created,
    })
  } catch (err) {
    console.error('[/api/admin/schedule-next]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
