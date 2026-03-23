import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { cancelEvent } from '@/lib/event-cancellation'
import { sendEventMinimumWarningEmail } from '@/lib/email'
import type { Event } from '@/types'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseAdminClient()
  const now = new Date()

  // 1. Find events past their cancellation deadline with registrations below minimum
  const { data: atRiskEvents, error } = await supabase
    .from('events')
    .select('*')
    .not('min_capacity', 'is', null)
    .lt('cancellation_deadline', now.toISOString())
    .is('cancelled_at', null)
    .gt('event_date', now.toISOString())

  if (error) {
    console.error('[cron/check-event-minimums] Query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let cancelledCount = 0
  let warningCount = 0

  for (const event of atRiskEvents ?? []) {
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['confirmed', 'pending'])

    const regCount = count ?? 0

    if (regCount < event.min_capacity) {
      try {
        await cancelEvent({
          eventId: event.id,
          reason: event.cancellation_reason ??
            'Unfortunately, this event did not reach the minimum number of registrations needed to proceed.',
          cancelledBy: 'auto',
        })
        cancelledCount++
      } catch (err) {
        console.error(`[cron] Failed to cancel event ${event.id}:`, err)
      }
    }
  }

  // 2. Warning emails for events approaching deadline (within 72 hours)
  const warningThreshold = new Date(now.getTime() + 72 * 60 * 60 * 1000)
  const warningCooldown = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const { data: warningEvents } = await supabase
    .from('events')
    .select('*')
    .not('min_capacity', 'is', null)
    .gt('cancellation_deadline', now.toISOString())
    .lt('cancellation_deadline', warningThreshold.toISOString())
    .is('cancelled_at', null)
    .gt('event_date', now.toISOString())

  for (const event of warningEvents ?? []) {
    if (event.min_check_sent_at && new Date(event.min_check_sent_at) > warningCooldown) {
      continue
    }

    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['confirmed', 'pending'])

    const regCount = count ?? 0

    if (regCount < event.min_capacity) {
      try {
        await sendEventMinimumWarningEmail({
          event: event as unknown as Event,
          currentCount: regCount,
        })

        await supabase
          .from('events')
          .update({ min_check_sent_at: now.toISOString() })
          .eq('id', event.id)

        warningCount++
      } catch (err) {
        console.error(`[cron] Failed to send warning for event ${event.id}:`, err)
      }
    }
  }

  return NextResponse.json({
    checked: (atRiskEvents?.length ?? 0) + (warningEvents?.length ?? 0),
    cancelled: cancelledCount,
    warnings: warningCount,
  })
}
