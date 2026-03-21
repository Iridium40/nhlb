import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('counselor_id', counselorId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slots: data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('availability_slots')
    .insert({
      counselor_id: counselorId,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data }, { status: 201 })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const { slots } = await req.json() as { slots: { day_of_week: number; start_time: string; end_time: string }[] }
  const supabase = createSupabaseAdminClient()

  await supabase
    .from('availability_slots')
    .update({ is_active: false })
    .eq('counselor_id', counselorId)

  if (slots.length > 0) {
    const rows = slots.map(s => ({
      counselor_id: counselorId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: true,
    }))
    const { error } = await supabase.from('availability_slots').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('counselor_id', counselorId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  return NextResponse.json({ slots: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ counselorId: string }> }
) {
  const { counselorId } = await params
  const { slotId } = await req.json()
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from('availability_slots')
    .update({ is_active: false })
    .eq('id', slotId)
    .eq('counselor_id', counselorId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
