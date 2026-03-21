import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('counselors')
    .select('*')
    .eq('id', counselorId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ counselor: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const updates: Record<string, unknown> = {}
  const fields = ['name', 'title', 'bio', 'email', 'phone', 'zoom_link', 'specialties', 'is_active']
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  const { data, error } = await supabase
    .from('counselors')
    .update(updates)
    .eq('id', counselorId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ counselor: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from('counselors')
    .delete()
    .eq('id', counselorId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
