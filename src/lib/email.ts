/**
 * email.ts — provider-agnostic email interface
 *
 * Set EMAIL_PROVIDER=resend  for development (default)
 * Set EMAIL_PROVIDER=ses     for production (HIPAA-eligible)
 *
 * To switch providers: change EMAIL_PROVIDER in environment variables.
 * No other file needs to change.
 */

import { render } from '@react-email/render'
import { BookingConfirmationEmail } from '../../emails/BookingConfirmation'
import { CounselorNotificationEmail } from '../../emails/CounselorNotification'
import { VirtualSessionInfoEmail } from '../../emails/VirtualSessionInfo'
import { CounselorAssignmentEmail } from '../../emails/CounselorAssignment'
import { HipaaIntakeEmail } from '../../emails/HipaaIntakeEmail'
import { generateICS } from '@/lib/ics'
import { format } from 'date-fns'
import type { Booking, Counselor, Client } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface SendEmailParams {
  to: string | string[]
  subject: string
  react: React.ReactElement
  attachments?: { filename: string; content: string; contentType: string }[]
}

// ── Provider: Resend ───────────────────────────────────────────────────────

async function sendViaResend({ to, subject, react, attachments }: SendEmailParams) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    react,
    attachments,
  })
}

// ── Provider: AWS SES ──────────────────────────────────────────────────────

async function sendViaSES({ to, subject, react, attachments }: SendEmailParams) {
  const html = await render(react)
  const recipients = Array.isArray(to) ? to : [to]

  if (attachments && attachments.length > 0) {
    const { SESClient, SendRawEmailCommand } = await import('@aws-sdk/client-ses')
    const ses = new SESClient({
      region: process.env.AWS_SES_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
      },
    })
    const boundary = `----=_Part_${Date.now()}`
    const fromEmail = process.env.SES_FROM_EMAIL!

    let rawMessage = [
      `From: ${fromEmail}`,
      `To: ${recipients.join(', ')}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
    ].join('\r\n')

    for (const att of attachments) {
      rawMessage += [
        '',
        `--${boundary}`,
        `Content-Type: ${att.contentType}; name="${att.filename}"`,
        `Content-Disposition: attachment; filename="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        att.content,
      ].join('\r\n')
    }

    rawMessage += `\r\n--${boundary}--`

    await ses.send(new SendRawEmailCommand({
      RawMessage: { Data: new TextEncoder().encode(rawMessage) },
    }))
  } else {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses')
    const ses = new SESClient({
      region: process.env.AWS_SES_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY!,
      },
    })
    await ses.send(new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL!,
      Destination: { ToAddresses: recipients },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    }))
  }
}

// ── Unified send function ──────────────────────────────────────────────────

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? 'resend'
  if (provider === 'ses') {
    await sendViaSES(params)
  } else {
    await sendViaResend(params)
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function adminEmail() { return process.env.ADMIN_EMAIL! }

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
}

function ref(bookingId: string) {
  return bookingId.slice(0, 8).toUpperCase()
}

// ── 1. Client booking confirmation ─────────────────────────────────────────

export async function sendBookingConfirmation({
  booking, counselor, client,
}: { booking: Booking; counselor: Counselor; client: Client }) {
  const icsContent = generateICS({ booking, counselor, client, perspective: 'client' })

  await sendEmail({
    to: client.email,
    subject: `Session confirmed — ref #${ref(booking.id)}`,
    react: BookingConfirmationEmail({ booking, counselor, client, baseUrl: baseUrl() }),
    attachments: [
      {
        filename: 'session.ics',
        content: Buffer.from(icsContent).toString('base64'),
        contentType: 'text/calendar; method=PUBLISH',
      },
    ],
  })
}

// ── 2. Internal counselor/admin notification ────────────────────────────────

export async function sendCounselorNotification({
  booking, counselor, client,
}: { booking: Booking; counselor: Counselor; client: Client }) {
  const icsContent = generateICS({ booking, counselor, client, perspective: 'counselor' })
  const date = format(new Date(booking.scheduled_at), 'EEE MMM d, h:mm a')

  const recipients = [adminEmail()]
  if (counselor.email && counselor.email !== adminEmail()) {
    recipients.push(counselor.email)
  }

  await sendEmail({
    to: recipients,
    subject: `New session — ${date} — ref #${ref(booking.id)}`,
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

// ── 3. Virtual session Zoom link ────────────────────────────────────────────

export async function sendVirtualSessionInfo({
  booking, counselor, client,
}: { booking: Booking; counselor: Counselor; client: Client }) {
  const date = format(new Date(booking.scheduled_at), 'MMM d')

  await sendEmail({
    to: client.email,
    subject: `Your session link — ${date} — ref #${ref(booking.id)}`,
    react: VirtualSessionInfoEmail({ booking, counselor, client }),
  })
}

// ── 4. Counselor assignment / reassignment ──────────────────────────────────

export async function sendCounselorAssignmentEmail({
  counselor, client, upcomingSessions, isReassignment,
}: {
  counselor: Counselor
  client: Client
  upcomingSessions: Booking[]
  isReassignment: boolean
}) {
  await sendEmail({
    to: client.email,
    subject: 'Your counselor at No Heart Left Behind',
    react: CounselorAssignmentEmail({
      counselor, client, upcomingSessions, isReassignment, baseUrl: baseUrl(),
    }),
  })
}

// ── 5. HIPAA intake link ────────────────────────────────────────────────────

export async function sendHipaaIntakeEmail({
  client, intakeUrl,
}: { client: Client; intakeUrl: string }) {
  await sendEmail({
    to: client.email,
    subject: 'Complete your intake form — No Heart Left Behind',
    react: HipaaIntakeEmail({ client, intakeUrl }),
  })
}
