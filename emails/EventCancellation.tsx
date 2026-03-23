import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Link
} from '@react-email/components'
import type { Event, EventRegistration } from '../src/types'
import { format } from 'date-fns'

interface Props {
  event: Event
  registration: EventRegistration
  reason: string
}

export function EventCancellationEmail({ event, registration, reason }: Props) {
  const date = format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Text style={{ color: '#B8311F', fontSize: 22, fontWeight: 'bold', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>
            ✕ Event Cancelled
          </Text>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Text style={{ color: '#3D1A14', fontSize: 15, lineHeight: '24px', fontFamily: 'Arial, sans-serif' }}>
            We&rsquo;re sorry to let you know that <strong>{event.title}</strong> ({date}) has been cancelled.
          </Text>

          {reason && (
            <Section style={{ background: '#FEF3C7', borderRadius: 6, padding: '12px 16px', margin: '16px 0', border: '1px solid #FDE68A' }}>
              <Text style={{ color: '#92400E', fontSize: 14, fontFamily: 'Arial, sans-serif', margin: 0, fontStyle: 'italic' }}>
                &ldquo;{reason}&rdquo;
              </Text>
            </Section>
          )}

          {registration.amount_paid_cents > 0 && (
            <>
              <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />
              <Heading style={{ color: '#3D1A14', fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 8 }}>
                Your Refund
              </Heading>
              <Text style={{ color: '#555', fontSize: 14, fontFamily: 'Arial, sans-serif', lineHeight: '22px' }}>
                A full refund of <strong>${(registration.amount_paid_cents / 100).toFixed(2)}</strong> has been
                issued to your original payment method. Please allow 5–10 business days for it to appear on
                your statement.
              </Text>
            </>
          )}

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Text style={{ color: '#555', fontSize: 14, fontFamily: 'Arial, sans-serif', lineHeight: '22px' }}>
            We hope to see you at a future event.
          </Text>
          <Link
            href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://nhlb.vercel.app'}/events`}
            style={{ color: '#B8311F', fontSize: 14, fontFamily: 'Arial, sans-serif' }}
          >
            View upcoming events →
          </Link>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Text style={{ color: '#555', fontSize: 13, fontFamily: 'Arial, sans-serif', lineHeight: '20px' }}>
            Questions? Call <strong>985-264-8808</strong> or email{' '}
            <Link href="mailto:reconnectus@yahoo.com" style={{ color: '#B8311F' }}>reconnectus@yahoo.com</Link>
          </Text>

          <Text style={{ color: '#9A5A50', fontSize: 13, marginTop: 32, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
            &ldquo;As a man thinks in his heart, so is he.&rdquo; &mdash; Proverbs 23:7
          </Text>
          <Text style={{ color: '#D4A898', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
            No Heart Left Behind &copy; {new Date().getFullYear()}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
