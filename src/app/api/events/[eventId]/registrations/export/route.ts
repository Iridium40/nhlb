import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = createSupabaseAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', eventId)
    .single()

  const { data: regs, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'pending'])
    .order('last_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build CSV
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Amount Paid', 'Registered At']
  const rows = (regs ?? []).map(r => [
    r.first_name,
    r.last_name,
    r.email,
    r.phone ?? '',
    `$${(r.amount_paid_cents / 100).toFixed(2)}`,
    format(new Date(r.created_at), 'MM/dd/yyyy h:mm a'),
  ])

  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const filename = `${(event?.title ?? 'event').replace(/[^a-zA-Z0-9]/g, '_')}_attendees.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
