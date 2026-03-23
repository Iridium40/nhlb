import { redirect, notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function EventConfirmationRedirect({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const supabase = createSupabaseAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('slug')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  if (event.slug) {
    redirect(`/events/${event.slug}/confirmed`)
  }

  redirect('/events')
}
