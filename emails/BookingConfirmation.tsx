import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Row, Column
} from '@react-email/components'
import type { Booking, Counselor, Client } from '../src/types'
import { format } from 'date-fns'

interface Props { booking: Booking; counselor: Counselor; client: Client }

export function BookingConfirmationEmail({ booking, counselor, client }: Props) {
  const date = format(new Date(booking.scheduled_at), 'EEEE, MMMM d, yyyy')
  const time = format(new Date(booking.scheduled_at), 'h:mm a')

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#f9f7f4', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Heading style={{ color: '#8B2015', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            Your session is confirmed
          </Heading>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>
          <Hr style={{ borderColor: '#e8e4de', margin: '24px 0' }} />

          <Section>
            <Row>
              <Column style={{ paddingRight: 16 }}>
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>DATE</Text>
                <Text style={{ color: '#1a1a1a', fontSize: 16, fontWeight: 'bold', margin: 0 }}>{date}</Text>
              </Column>
              <Column>
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>TIME</Text>
                <Text style={{ color: '#1a1a1a', fontSize: 16, fontWeight: 'bold', margin: 0 }}>{time}</Text>
              </Column>
            </Row>

            <Row style={{ marginTop: 20 }}>
              <Column style={{ paddingRight: 16 }}>
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>COUNSELOR</Text>
                <Text style={{ color: '#1a1a1a', fontSize: 16, margin: 0 }}>{counselor.name}</Text>
                <Text style={{ color: '#666', fontSize: 14, margin: '2px 0 0' }}>{counselor.title}</Text>
              </Column>
              <Column>
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>FORMAT</Text>
                <Text style={{ color: '#1a1a1a', fontSize: 16, margin: 0 }}>
                  {booking.session_format === 'virtual' ? '💻 Virtual' : '📍 In Person'}
                </Text>
                {booking.session_format === 'virtual' && (
                  <Text style={{ color: '#666', fontSize: 13, margin: '2px 0 0' }}>
                    A video link will be sent before your session
                  </Text>
                )}
              </Column>
            </Row>
          </Section>

          <Hr style={{ borderColor: '#e8e4de', margin: '24px 0' }} />

          {booking.session_format === 'virtual' ? (
            <Section style={{ background: '#F5EDE8', borderRadius: 6, padding: '16px 20px', border: '1px solid #F0E0D8' }}>
              <Text style={{ color: '#8B2015', fontSize: 14, fontWeight: 'bold', margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>
                💻 Virtual session
              </Text>
              {booking.meeting_link ? (
                <>
                  <Text style={{ color: '#555', fontSize: 13, margin: '0 0 4px' }}>
                    <strong>Join link:</strong>{' '}
                    <a href={booking.meeting_link} style={{ color: '#B8311F' }}>{booking.meeting_link}</a>
                  </Text>
                  {booking.meeting_id && (
                    <Text style={{ color: '#555', fontSize: 13, margin: '4px 0' }}>
                      <strong>Meeting ID:</strong> {booking.meeting_id}
                    </Text>
                  )}
                  {booking.meeting_passcode && (
                    <Text style={{ color: '#555', fontSize: 13, margin: '4px 0' }}>
                      <strong>Passcode:</strong> {booking.meeting_passcode}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={{ color: '#9A5A50', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                  Your counselor will send a secure video link before your session.
                </Text>
              )}
              <Text style={{ color: '#555', fontSize: 13, margin: '10px 0 0' }}>
                <strong>Questions?</strong> Call 985-264-8808 or email reconnectus@yahoo.com
              </Text>
            </Section>
          ) : (
            <Section style={{ background: '#f9f7f4', borderRadius: 6, padding: '16px 20px' }}>
              <Text style={{ color: '#555', fontSize: 14, margin: 0 }}>
                <strong>Location:</strong> 430 N. Jefferson Ave, Covington, LA 70433
              </Text>
              <Text style={{ color: '#555', fontSize: 14, margin: '8px 0 0' }}>
                <strong>Questions?</strong> Call 985-264-8808 or email reconnectus@yahoo.com
              </Text>
            </Section>
          )}

          <Text style={{ color: '#666', fontSize: 13, marginTop: 32, fontStyle: 'italic' }}>
            &ldquo;As a man thinks in his heart, so is he.&rdquo; &mdash; Proverbs 23:7
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            No Heart Left Behind &copy; {new Date().getFullYear()}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
