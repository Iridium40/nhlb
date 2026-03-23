import { redirect, notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function EventIdRedirect({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  // If the param looks like a UUID, look up the event and redirect to its slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)

  if (!isUUID) {
    notFound()
  }

  const supabase = createSupabaseAdminClient()
  const { data: event } = await supabase
    .from('events')
    .select('slug')
    .eq('id', eventId)
    .single()

  if (!event) notFound()

  if (event.slug) {
    redirect(`/events/${event.slug}`)
  }

  // Fallback: if no slug yet, redirect to events listing
  redirect('/events')
}
