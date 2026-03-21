import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('counselors')
    .select('*')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ counselors: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('counselors')
    .insert({
      name: body.name,
      title: body.title,
      bio: body.bio ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      zoom_link: body.zoom_link ?? null,
      zoom_meeting_id: body.zoom_meeting_id ?? null,
      zoom_passcode: body.zoom_passcode ?? null,
      specialties: body.specialties ?? [],
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ counselor: data }, { status: 201 })
}
