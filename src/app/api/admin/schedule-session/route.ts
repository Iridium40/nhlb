import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendBookingConfirmation, sendCounselorNotification } from '@/lib/email'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      client_id,
      counselor_id,
      scheduled_at,
      type,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
    } = body

    if (!client_id || !counselor_id || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: counselor, error: counselorErr } = await supabase
      .from('counselors')
      .select('*')
      .eq('id', counselor_id)
      .single()

    if (counselorErr || !counselor) {
      return NextResponse.json({ error: 'Counselor not found' }, { status: 404 })
    }

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

        if (cursor <= endDate) dates.push(new Date(cursor))
        cursor = addDays(cursor, interval)
      }
    }

    const inserts = dates.map((d, i) => ({
      client_id,
      counselor_id,
      scheduled_at: d.toISOString(),
      type: type || 'IN_PERSON',
      status: 'confirmed',
      duration_minutes: 60,
      is_recurring: is_recurring ?? false,
      recurrence_pattern: is_recurring ? (recurrence_pattern ?? null) : null,
      recurrence_end_date: is_recurring ? (recurrence_end_date ?? null) : null,
      parent_booking_id: null,
      series_index: i + 1,
      donation_amount_cents: 0,
    }))

    const { data: created, error: insErr } = await supabase
      .from('bookings')
      .insert(inserts)
      .select()

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    // Link series if recurring
    if (created && created.length > 1) {
      const parentId = created[0].id
      await supabase
        .from('bookings')
        .update({ parent_booking_id: parentId })
        .in('id', created.slice(1).map(b => b.id))
    }

    // Update client's assigned counselor if not yet assigned
    if (!client.assigned_counselor_id) {
      await supabase
        .from('clients')
        .update({ assigned_counselor_id: counselor_id })
        .eq('id', client_id)
    }

    // Send confirmation email for the first session
    if (created?.[0]) {
      try {
        await Promise.allSettled([
          sendBookingConfirmation({ booking: created[0], counselor, client }),
          sendCounselorNotification({ booking: created[0], counselor, client }),
        ])
      } catch {
        // Best-effort
      }
    }

    return NextResponse.json({
      created: created?.length ?? 0,
      bookings: created,
    })
  } catch (err) {
    console.error('[/api/admin/schedule-session]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
