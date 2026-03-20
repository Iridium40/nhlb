import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const counselorId = searchParams.get('counselorId')

  if (!counselorId) {
    return NextResponse.json({ error: 'counselorId required' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const from = startOfDay(new Date()).toISOString()
  const to = endOfDay(addDays(new Date(), 14)).toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .select('scheduled_at')
    .eq('counselor_id', counselorId)
    .neq('status', 'cancelled')
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookedSlots: data.map(b => b.scheduled_at) })
}
