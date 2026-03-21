import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

const BUCKET = 'profile_image'

async function getAuthenticatedCounselor() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const admin = createSupabaseAdminClient()
  const { data: counselor, error } = await admin
    .from('counselors')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single()

  if (error || !counselor) {
    return { error: NextResponse.json({ error: 'No counselor profile linked to this account' }, { status: 403 }) }
  }

  return { counselor, admin }
}

export async function POST(req: NextRequest) {
  const result = await getAuthenticatedCounselor()
  if ('error' in result && result.error instanceof NextResponse) return result.error
  const { counselor, admin } = result as Exclude<typeof result, { error: NextResponse }>

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `counselor-${counselor.id}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (counselor.photo_url) {
    const oldPath = extractStoragePath(counselor.photo_url)
    if (oldPath) {
      await admin.storage.from(BUCKET).remove([oldPath])
    }
  }

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(filename)
  const publicUrl = publicUrlData.publicUrl

  const { data, error: updateError } = await admin
    .from('counselors')
    .update({ photo_url: publicUrl })
    .eq('id', counselor.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ counselor: data, photo_url: publicUrl })
}

export async function DELETE() {
  const result = await getAuthenticatedCounselor()
  if ('error' in result && result.error instanceof NextResponse) return result.error
  const { counselor, admin } = result as Exclude<typeof result, { error: NextResponse }>

  if (!counselor.photo_url) {
    return NextResponse.json({ error: 'No photo to remove' }, { status: 400 })
  }

  const storagePath = extractStoragePath(counselor.photo_url)
  if (storagePath) {
    await admin.storage.from(BUCKET).remove([storagePath])
  }

  const { data, error: updateError } = await admin
    .from('counselors')
    .update({ photo_url: null })
    .eq('id', counselor.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ counselor: data })
}

function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}
