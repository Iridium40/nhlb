import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Row, Column, Link
} from '@react-email/components'
import type { Booking, Counselor, Client } from '../src/types'
import { format } from 'date-fns'

interface Props { booking: Booking; counselor: Counselor; client: Client; baseUrl?: string }

export function BookingConfirmationEmail({ booking, counselor, client, baseUrl = 'https://nhlb.vercel.app' }: Props) {
  const date = format(new Date(booking.scheduled_at), 'EEEE, MMMM d, yyyy')
  const time = format(new Date(booking.scheduled_at), 'h:mm a')
  const cancelUrl = `${baseUrl}/book/cancel?id=${booking.id}&email=${encodeURIComponent(client.email)}`

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Heading style={{ color: '#8B2015', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            Your session is confirmed
          </Heading>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section>
            <Row>
              <Column style={{ paddingRight: 16 }}>
                <Text style={{ color: '#9A5A50', fontSize: 12, marginBottom: 2 }}>DATE</Text>
                <Text style={{ color: '#3D1A14', fontSize: 16, fontWeight: 'bold', margin: 0 }}>{date}</Text>
              </Column>
              <Column>
                <Text style={{ color: '#9A5A50', fontSize: 12, marginBottom: 2 }}>TIME</Text>
                <Text style={{ color: '#3D1A14', fontSize: 16, fontWeight: 'bold', margin: 0 }}>{time}</Text>
              </Column>
            </Row>

            <Row style={{ marginTop: 20 }}>
              <Column style={{ paddingRight: 16 }}>
                <Text style={{ color: '#9A5A50', fontSize: 12, marginBottom: 2 }}>COUNSELOR</Text>
                <Text style={{ color: '#3D1A14', fontSize: 16, margin: 0 }}>{counselor.name}</Text>
                <Text style={{ color: '#9A5A50', fontSize: 14, margin: '2px 0 0' }}>{counselor.title}</Text>
              </Column>
              <Column>
                <Text style={{ color: '#9A5A50', fontSize: 12, marginBottom: 2 }}>FORMAT</Text>
                <Text style={{ color: '#3D1A14', fontSize: 16, margin: 0 }}>
                  {booking.type === 'VIRTUAL' ? '💻 Virtual' : '📍 In Person'}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          {booking.type === 'VIRTUAL' ? (
            <Section style={{ background: '#F5EDE8', borderRadius: 6, padding: '16px 20px', border: '1px solid #F0E0D8' }}>
              <Text style={{ color: '#8B2015', fontSize: 14, fontWeight: 'bold', margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>
                💻 Virtual session
              </Text>
              {counselor.zoom_link ? (
                <Text style={{ color: '#555', fontSize: 13, margin: '0 0 4px' }}>
                  <strong>Join link:</strong>{' '}
                  <a href={counselor.zoom_link} style={{ color: '#B8311F' }}>{counselor.zoom_link}</a>
                </Text>
              ) : (
                <Text style={{ color: '#9A5A50', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                  Your counselor will send a secure video link before your session.
                </Text>
              )}
            </Section>
          ) : (
            <Section style={{ background: '#FDFAF8', borderRadius: 6, padding: '16px 20px' }}>
              <Text style={{ color: '#3D1A14', fontSize: 14, margin: 0 }}>
                <strong>Location:</strong> 430 N. Jefferson Ave, Covington, LA 70433
              </Text>
              <Text style={{ color: '#3D1A14', fontSize: 14, margin: '8px 0 0' }}>
                <strong>Questions?</strong> Call 985-264-8808 or email reconnectus@yahoo.com
              </Text>
            </Section>
          )}

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section style={{ background: '#EAF5EE', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
            <Text style={{ color: '#065F46', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: 0, lineHeight: '20px' }}>
              📅 A calendar file (session.ics) is attached to this email.
              Open it to add this appointment to your calendar.
            </Text>
          </Section>

          <Section>
            <Text style={{ color: '#555', fontSize: 13, fontFamily: 'Arial, sans-serif', lineHeight: '20px' }}>
              Need to cancel? You can cancel online up to 24 hours before your appointment.
              For cancellations within 24 hours, please call us at <strong>985-264-8808</strong>.
            </Text>
            <Link href={cancelUrl} style={{ color: '#B8311F', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>
              Cancel this appointment
            </Link>
          </Section>

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
