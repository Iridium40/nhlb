import { NextRequest, NextResponse } from 'next/server'
import { cancelEvent } from '@/lib/event-cancellation'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await req.json()
    const reason = body.reason || 'This event has been cancelled.'

    const result = await cancelEvent({
      eventId,
      reason,
      cancelledBy: 'admin',
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/events/[eventId]/cancel]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
