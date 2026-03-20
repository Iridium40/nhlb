import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Button, Row, Column
} from '@react-email/components'
import type { Booking, Counselor, Client } from '../src/types'
import { format } from 'date-fns'

interface Props { booking: Booking; counselor: Counselor; client: Client }

export function VirtualSessionInfoEmail({ booking, counselor }: Props) {
  const date = format(new Date(booking.scheduled_at), 'EEEE, MMMM d, yyyy')
  const time = format(new Date(booking.scheduled_at), 'h:mm a')

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>

          <Heading style={{ color: '#8B2015', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            Your virtual session is ready
          </Heading>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>

          <Hr style={{ borderColor: '#F0E0D8', margin: '20px 0' }} />

          <Row>
            <Column style={{ paddingRight: 16 }}>
              <Text style={{ color: '#9A5A50', fontSize: 11, fontFamily: 'Arial, sans-serif', letterSpacing: '0.06em', marginBottom: 2 }}>DATE</Text>
              <Text style={{ color: '#3D1A14', fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', margin: 0 }}>{date}</Text>
            </Column>
            <Column>
              <Text style={{ color: '#9A5A50', fontSize: 11, fontFamily: 'Arial, sans-serif', letterSpacing: '0.06em', marginBottom: 2 }}>TIME</Text>
              <Text style={{ color: '#3D1A14', fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', margin: 0 }}>{time}</Text>
            </Column>
          </Row>

          <Text style={{ color: '#9A5A50', fontSize: 11, fontFamily: 'Arial, sans-serif', letterSpacing: '0.06em', marginTop: 16, marginBottom: 2 }}>COUNSELOR</Text>
          <Text style={{ color: '#3D1A14', fontSize: 15, fontFamily: 'Arial, sans-serif', margin: 0 }}>{counselor.name}</Text>
          <Text style={{ color: '#9A5A50', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '2px 0 0' }}>{counselor.title}</Text>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section style={{
            background: '#F5EDE8', borderRadius: 8,
            padding: '20px 24px', border: '1px solid #F0E0D8',
          }}>
            <Text style={{
              color: '#8B2015', fontSize: 16, fontWeight: 'bold',
              fontFamily: 'Georgia, serif', margin: '0 0 16px',
            }}>
              💻 How to join your session
            </Text>

            {booking.meeting_link && (
              <Button
                href={booking.meeting_link}
                style={{
                  display: 'block',
                  backgroundColor: '#B8311F', color: '#ffffff',
                  fontFamily: 'Arial, sans-serif', fontWeight: 'bold',
                  fontSize: 14, letterSpacing: '0.04em',
                  padding: '12px 24px', borderRadius: 6,
                  textDecoration: 'none', textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                Join Session &rarr;
              </Button>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#9A5A50', paddingBottom: 8, width: '36%' }}>
                    Meeting link
                  </td>
                  <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#3D1A14', paddingBottom: 8, wordBreak: 'break-all' as const }}>
                    {booking.meeting_link}
                  </td>
                </tr>
                {booking.meeting_id && (
                  <tr>
                    <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#9A5A50', paddingBottom: 8 }}>
                      Meeting ID
                    </td>
                    <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#3D1A14', paddingBottom: 8, fontWeight: 'bold', letterSpacing: '0.05em' }}>
                      {booking.meeting_id}
                    </td>
                  </tr>
                )}
                {booking.meeting_passcode && (
                  <tr>
                    <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#9A5A50' }}>
                      Passcode
                    </td>
                    <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#3D1A14', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                      {booking.meeting_passcode}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section>
            <Text style={{ color: '#9A5A50', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '0 0 6px', fontWeight: 'bold' }}>
              A few tips before you join:
            </Text>
            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', lineHeight: 1.5 }}>
              &bull; Join from a quiet, private space where you feel comfortable
            </Text>
            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', lineHeight: 1.5 }}>
              &bull; Test your audio and video a few minutes early
            </Text>
            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', lineHeight: 1.5 }}>
              &bull; Have the link handy &mdash; it&apos;s unique to your session
            </Text>
          </Section>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section style={{ background: '#FDFAF8', borderRadius: 6, padding: '14px 18px' }}>
            <Text style={{ color: '#9A5A50', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: 0 }}>
              <strong>Questions?</strong> Call 985-264-8808 or email reconnectus@yahoo.com
            </Text>
          </Section>

          <Text style={{ color: '#9A5A50', fontSize: 13, marginTop: 28, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
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
