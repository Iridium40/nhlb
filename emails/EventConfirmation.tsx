import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Link
} from '@react-email/components'
import type { Event, EventRegistration } from '../src/types'
import { format } from 'date-fns'

interface Props {
  event: Event
  registration: EventRegistration
  baseUrl?: string
}

export function EventConfirmationEmail({
  event,
  registration,
  baseUrl = 'https://nhlb.vercel.app',
}: Props) {
  const date = format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')
  const startTime = format(new Date(event.event_date), 'h:mm a')
  const endTime = event.end_date ? format(new Date(event.end_date), 'h:mm a') : null

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Text style={{ color: '#065F46', fontSize: 28, fontWeight: 'bold', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>
            ✓ You&rsquo;re registered!
          </Text>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Heading style={{ color: '#8B2015', fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 4 }}>
            {event.title}
          </Heading>

          <Section>
            <Text style={{ color: '#3D1A14', fontSize: 15, margin: '8px 0 4px' }}>
              <strong>📅 Date:</strong> {date}
            </Text>
            <Text style={{ color: '#3D1A14', fontSize: 15, margin: '4px 0' }}>
              <strong>🕐 Time:</strong> {startTime}{endTime ? ` – ${endTime}` : ''}
            </Text>
            {event.location && (
              <Text style={{ color: '#3D1A14', fontSize: 15, margin: '4px 0' }}>
                <strong>📍 Location:</strong> {event.location}
              </Text>
            )}
            {registration.amount_paid_cents > 0 && (
              <Text style={{ color: '#3D1A14', fontSize: 15, margin: '4px 0' }}>
                <strong>💳 Paid:</strong> ${(registration.amount_paid_cents / 100).toFixed(2)}
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section style={{ background: '#EAF5EE', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
            <Text style={{ color: '#065F46', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: 0, lineHeight: '20px' }}>
              📅 A calendar file (event.ics) is attached. Open it to add this event to your calendar.
            </Text>
          </Section>

          <Section>
            <Link
              href={`${baseUrl}/events/${event.slug || event.id}`}
              style={{ color: '#B8311F', fontSize: 13, fontFamily: 'Arial, sans-serif' }}
            >
              View event details
            </Link>
          </Section>

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
