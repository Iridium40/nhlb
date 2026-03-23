import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendVirtualSessionInfo } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json()
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, client:clients(*), counselor:counselors(*)')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.type !== 'VIRTUAL') {
      return NextResponse.json({ error: 'This session is not virtual' }, { status: 400 })
    }

    const counselor = booking.counselor
    if (!counselor?.zoom_link) {
      return NextResponse.json({ error: 'No Zoom link set for this counselor. Add it in counselor settings first.' }, { status: 400 })
    }

    await sendVirtualSessionInfo({
      booking,
      counselor,
      client: booking.client,
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[/api/admin/notify]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
