import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase'
import EventSlugClient from './EventSlugClient'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ slug: string }>
}

async function resolveEvent(slug: string) {
  const supabase = createSupabaseAdminClient()

  if (UUID_RE.test(slug)) {
    const { data: event } = await supabase
      .from('events')
      .select('slug')
      .eq('id', slug)
      .single()
    if (event?.slug) redirect(`/events/${event.slug}`)
    notFound()
  }

  const { data: event } = await supabase
    .from('events')
    .select('title, description, event_date, image_url, location, slug')
    .eq('slug', slug)
    .single()

  return event
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  if (UUID_RE.test(slug)) {
    return { title: 'Redirecting… — No Heart Left Behind' }
  }

  const event = await resolveEvent(slug)
  if (!event) {
    return { title: 'Event Not Found — No Heart Left Behind' }
  }

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const plainDescription =
    event.description?.replace(/<[^>]+>/g, '').slice(0, 160) ?? ''
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://nhlb.vercel.app'
  const locationSuffix = event.location ? ` · ${event.location}` : ''

  return {
    title: `${event.title} — No Heart Left Behind`,
    description: `${formattedDate}${locationSuffix}. ${plainDescription}`,
    openGraph: {
      title: event.title,
      description: `${formattedDate}${locationSuffix}`,
      url: `${baseUrl}/events/${slug}`,
      siteName: 'No Heart Left Behind',
      images: event.image_url
        ? [{ url: event.image_url, width: 1200, height: 630, alt: event.title }]
        : [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: 'No Heart Left Behind' }],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: event.image_url ? 'summary_large_image' : 'summary',
      title: event.title,
      description: `${formattedDate}${locationSuffix}`,
      images: event.image_url ? [event.image_url] : undefined,
    },
  }
}

export default async function EventSlugPage({ params }: Props) {
  const { slug } = await params
  await resolveEvent(slug)
  return <EventSlugClient slug={slug} />
}
