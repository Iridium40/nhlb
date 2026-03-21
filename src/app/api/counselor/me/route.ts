import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

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

  return { counselor, user, admin }
}

export async function GET() {
  const result = await getAuthenticatedCounselor()
  if ('error' in result && result.error instanceof NextResponse) return result.error
  const { counselor, user } = result as Exclude<typeof result, { error: NextResponse }>
  return NextResponse.json({ counselor, userId: user.id })
}

const ALLOWED_FIELDS = ['name', 'title', 'bio', 'email', 'phone', 'zoom_link', 'zoom_meeting_id', 'zoom_passcode', 'specialties', 'photo_url'] as const

export async function PATCH(req: NextRequest) {
  const result = await getAuthenticatedCounselor()
  if ('error' in result && result.error instanceof NextResponse) return result.error
  const { counselor, admin } = result as Exclude<typeof result, { error: NextResponse }>

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('counselors')
    .update(updates)
    .eq('id', counselor.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ counselor: data })
}
