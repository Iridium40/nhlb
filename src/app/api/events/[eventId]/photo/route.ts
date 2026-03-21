import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

const BUCKET = 'events'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const admin = createSupabaseAdminClient()

  const { data: event, error: fetchErr } = await admin
    .from('events')
    .select('id, image_url')
    .eq('id', eventId)
    .single()

  if (fetchErr || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `event-${eventId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  if (event.image_url) {
    const oldPath = extractStoragePath(event.image_url)
    if (oldPath) await admin.storage.from(BUCKET).remove([oldPath])
  }

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(filename)

  const { data, error: updateError } = await admin
    .from('events')
    .update({ image_url: publicUrlData.publicUrl })
    .eq('id', eventId)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ event: data, image_url: publicUrlData.publicUrl })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const admin = createSupabaseAdminClient()

  const { data: event, error: fetchErr } = await admin
    .from('events')
    .select('id, image_url')
    .eq('id', eventId)
    .single()

  if (fetchErr || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (!event.image_url) return NextResponse.json({ error: 'No image to remove' }, { status: 400 })

  const storagePath = extractStoragePath(event.image_url)
  if (storagePath) await admin.storage.from(BUCKET).remove([storagePath])

  const { data, error: updateError } = await admin
    .from('events')
    .update({ image_url: null })
    .eq('id', eventId)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ event: data })
}

function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}
