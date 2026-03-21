import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const search = searchParams.get('search')
  const supabase = createSupabaseAdminClient()

  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })

  if (email) {
    query = query.eq('email', email)
  } else if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For email lookup, also fetch their last counselor
  if (email && data && data.length > 0) {
    const clientId = data[0].id
    const { data: lastBooking } = await supabase
      .from('bookings')
      .select('counselor_id, counselor:counselors(id, name, title, zoom_link)')
      .eq('client_id', clientId)
      .eq('status', 'COMPLETED')
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      clients: data,
      lastCounselor: lastBooking?.counselor ?? null,
    })
  }

  return NextResponse.json({ clients: data })
}
