import { createSupabaseAdminClient } from '@/lib/supabase'
import {
  sendEventCancellationEmail,
  sendEventCancellationSummaryEmail,
} from '@/lib/email'
import type { Event, EventRegistration } from '@/types'

export async function cancelEvent({
  eventId,
  reason,
  cancelledBy,
}: {
  eventId: string
  reason: string
  cancelledBy: 'auto' | 'admin'
}) {
  const supabase = createSupabaseAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'confirmed')

  if (!event || !registrations) throw new Error('Event or registrations not found')

  await supabase
    .from('events')
    .update({
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      is_published: false,
    })
    .eq('id', eventId)

  const paidRegistrations = registrations.filter(
    (r: EventRegistration) => r.amount_paid_cents > 0 && r.stripe_payment_id
  )

  const refundResults = await Promise.allSettled(
    paidRegistrations.map((r: EventRegistration) => refundRegistration(r))
  )

  await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('status', 'confirmed')

  const succeeded = refundResults.filter(r => r.status === 'fulfilled').length
  const failed = refundResults.filter(r => r.status === 'rejected').length
  const totalRefundCents = paidRegistrations.reduce(
    (sum: number, r: EventRegistration) => sum + r.amount_paid_cents,
    0
  )

  const failedRefunds: { name: string; email: string; amountCents: number }[] = []
  refundResults.forEach((result, i) => {
    if (result.status === 'rejected') {
      const r = paidRegistrations[i]
      failedRefunds.push({
        name: `${r.first_name} ${r.last_name}`,
        email: r.email,
        amountCents: r.amount_paid_cents,
      })
    }
  })

  await Promise.allSettled(
    registrations.map((r: EventRegistration) =>
      sendEventCancellationEmail({
        event: event as unknown as Event,
        registration: r as unknown as EventRegistration,
        reason,
      })
    )
  )

  try {
    await sendEventCancellationSummaryEmail({
      event: event as unknown as Event,
      totalRegistrants: registrations.length,
      refundsIssued: succeeded,
      refundsFailed: failed,
      totalRefundCents,
      cancelledBy,
      failedRefunds,
    })
  } catch (err) {
    console.error('[cancelEvent] Summary email failed:', err)
  }

  return {
    cancelled: true,
    refundsIssued: succeeded,
    refundsFailed: failed,
  }
}

async function refundRegistration(registration: EventRegistration) {
  const { getStripe } = await import('@/lib/stripe')
  const stripe = getStripe()
  const supabase = createSupabaseAdminClient()

  const refund = await stripe.refunds.create({
    payment_intent: registration.stripe_payment_id!,
    reason: 'requested_by_customer',
    metadata: {
      registrationId: registration.id,
      eventId: registration.event_id,
      reason: 'event_cancelled_below_minimum',
    },
  })

  await supabase
    .from('event_registrations')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_amount_cents: refund.amount,
      stripe_refund_id: refund.id,
    })
    .eq('id', registration.id)

  return refund
}
