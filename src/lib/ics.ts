import { addMinutes, format } from 'date-fns'
import type { Booking, Counselor, Client } from '@/types'

function pad(n: number) { return n.toString().padStart(2, '0') }

function toICSDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateICS({
  booking,
  counselor,
  client,
  perspective,
}: {
  booking: Booking
  counselor: Counselor
  client: Client
  perspective: 'client' | 'counselor'
}): string {
  const start = new Date(booking.scheduled_at)
  const end = addMinutes(start, booking.duration_minutes || 60)
  const now = new Date()

  const isVirtual = booking.type === 'VIRTUAL'
  const location = isVirtual
    ? (counselor.zoom_link ?? 'Virtual — link will be provided')
    : '430 N. Jefferson Ave, Covington, LA 70433'

  const summary = perspective === 'client'
    ? `Counseling Session with ${counselor.name}`
    : `Session: ${client.first_name} ${client.last_name}`

  const zoomDetails = isVirtual ? [
    counselor.zoom_link ? `Join: ${counselor.zoom_link}` : null,
    counselor.zoom_meeting_id ? `Meeting ID: ${counselor.zoom_meeting_id}` : null,
    counselor.zoom_passcode ? `Passcode: ${counselor.zoom_passcode}` : null,
  ].filter(Boolean).join('\\n') : ''

  const description = perspective === 'client'
    ? `Your ${isVirtual ? 'virtual' : 'in-person'} counseling session with ${counselor.name} (${counselor.title}).${zoomDetails ? '\\n\\n' + zoomDetails : ''}\\n\\nNo Heart Left Behind\\n985-264-8808\\nreconnectus@yahoo.com`
    : `${isVirtual ? 'Virtual' : 'In-person'} session with ${client.first_name} ${client.last_name}.\\nEmail: ${client.email}${client.phone ? '\\nPhone: ' + client.phone : ''}\\nService: ${client.service_type}${client.brief_reason ? '\\nReason: ' + client.brief_reason : ''}${zoomDetails ? '\\n\\n' + zoomDetails : ''}`

  const readableDate = format(start, 'EEEE, MMMM d, yyyy')
  const readableTime = format(start, 'h:mm a')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NHLB//Counseling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@nhlb.vercel.app`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}\\n\\n${readableDate} at ${readableTime}`,
    `LOCATION:${escapeText(location)}`,
    `ORGANIZER;CN=No Heart Left Behind:mailto:reconnectus@yahoo.com`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Counseling session in 30 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}
