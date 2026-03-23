import { Resend } from 'resend'
import { BookingConfirmationEmail } from '../../emails/BookingConfirmation'
import { CounselorNotificationEmail } from '../../emails/CounselorNotification'
import { VirtualSessionInfoEmail } from '../../emails/VirtualSessionInfo'
import { HipaaIntakeEmail } from '../../emails/HipaaIntakeEmail'
import { CounselorAssignmentEmail } from '../../emails/CounselorAssignment'
import { generateICS } from '@/lib/ics'
import type { Booking, Counselor, Client } from '@/types'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
function from() { return process.env.RESEND_FROM_EMAIL! }
function adminEmail() { return process.env.ADMIN_EMAIL! }

export async function sendBookingConfirmation({
  booking,
  counselor,
  client,
}: {
  booking: Booking
  counselor: Counselor
  client: Client
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const icsContent = generateICS({ booking, counselor, client, perspective: 'client' })

  await getResend().emails.send({
    from: from(),
    to: client.email,
    subject: 'Your NHLB counseling session is confirmed',
    react: BookingConfirmationEmail({ booking, counselor, client, baseUrl }),
    attachments: [
      {
        filename: 'session.ics',
        content: Buffer.from(icsContent).toString('base64'),
        contentType: 'text/calendar; method=PUBLISH',
      },
    ],
  })
}

export async function sendCounselorNotification({
  booking,
  counselor,
  client,
}: {
  booking: Booking
  counselor: Counselor
  client: Client
}) {
  const icsContent = generateICS({ booking, counselor, client, perspective: 'counselor' })

  const recipients = [adminEmail()]
  if (counselor.email && counselor.email !== adminEmail()) {
    recipients.push(counselor.email)
  }

  await getResend().emails.send({
    from: from(),
    to: recipients,
    subject: `New session — ${client.first_name} ${client.last_name}`,
    react: CounselorNotificationEmail({ booking, counselor, client }),
    attachments: [
      {
        filename: 'session.ics',
        content: Buffer.from(icsContent).toString('base64'),
        contentType: 'text/calendar; method=PUBLISH',
      },
    ],
  })
}

export async function sendVirtualSessionInfo({
  booking,
  counselor,
  client,
}: {
  booking: Booking
  counselor: Counselor
  client: Client
}) {
  await getResend().emails.send({
    from: from(),
    to: client.email,
    subject: `Your virtual session details — ${counselor.name}`,
    react: VirtualSessionInfoEmail({ booking, counselor, client }),
  })
}

export async function sendCounselorAssignmentEmail({
  counselor,
  client,
  upcomingSessions,
  isReassignment,
}: {
  counselor: Counselor
  client: Client
  upcomingSessions: Booking[]
  isReassignment: boolean
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  await getResend().emails.send({
    from: from(),
    to: client.email,
    subject: isReassignment
      ? `Your counselor has been updated — ${counselor.name}`
      : `Meet your counselor — ${counselor.name}`,
    react: CounselorAssignmentEmail({ counselor, client, upcomingSessions, isReassignment, baseUrl }),
  })
}

export async function sendHipaaIntakeEmail({
  client,
  intakeUrl,
}: {
  client: Client
  intakeUrl: string
}) {
  await getResend().emails.send({
    from: from(),
    to: client.email,
    subject: 'Please complete your NHLB intake form',
    react: HipaaIntakeEmail({ client, intakeUrl }),
  })
}
