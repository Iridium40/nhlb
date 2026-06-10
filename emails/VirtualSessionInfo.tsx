import {
  Html, Head, Body, Container, Section, Img,
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
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FAF6F5', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Section style={{ backgroundColor: '#763535', borderRadius: 8, padding: '20px 24px', textAlign: 'center', marginBottom: 24 }}>
            <Img src="https://rgssitykmtunydrbuuhc.supabase.co/storage/v1/object/public/NHLB_Images/No-Heart-Left-Behind-Horizontal-White.svg" alt="No Heart Left Behind" width="220" style={{ margin: '0 auto', display: 'block' }} />
          </Section>
          <Heading style={{ color: '#763535', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            Your virtual session is ready
          </Heading>
          <Text style={{ color: '#8A6A62', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>

          <Hr style={{ borderColor: '#FCEEE7', margin: '20px 0' }} />

          <Row>
            <Column style={{ paddingRight: 16 }}>
              <Text style={{ color: '#8A6A62', fontSize: 11, fontFamily: 'Arial, sans-serif', letterSpacing: '0.06em', marginBottom: 2 }}>DATE</Text>
              <Text style={{ color: '#241F1E', fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', margin: 0 }}>{date}</Text>
            </Column>
            <Column>
              <Text style={{ color: '#8A6A62', fontSize: 11, fontFamily: 'Arial, sans-serif', letterSpacing: '0.06em', marginBottom: 2 }}>TIME</Text>
              <Text style={{ color: '#241F1E', fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', margin: 0 }}>{time}</Text>
            </Column>
          </Row>

          <Text style={{ color: '#8A6A62', fontSize: 11, fontFamily: 'Arial, sans-serif', letterSpacing: '0.06em', marginTop: 16, marginBottom: 2 }}>COUNSELOR</Text>
          <Text style={{ color: '#241F1E', fontSize: 15, fontFamily: 'Arial, sans-serif', margin: 0 }}>{counselor.name}</Text>
          <Text style={{ color: '#8A6A62', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '2px 0 0' }}>{counselor.title}</Text>

          <Hr style={{ borderColor: '#FCEEE7', margin: '24px 0' }} />

          <Section style={{
            background: '#F8F3ED', borderRadius: 8,
            padding: '20px 24px', border: '1px solid #FCEEE7',
          }}>
            <Text style={{
              color: '#763535', fontSize: 16, fontWeight: 'bold',
              fontFamily: 'Georgia, serif', margin: '0 0 16px',
            }}>
              💻 How to join your session
            </Text>

            {counselor.zoom_link && (
              <Button
                href={counselor.zoom_link}
                style={{
                  display: 'block',
                  backgroundColor: '#A90113', color: '#ffffff',
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
                {counselor.zoom_link && (
                  <tr>
                    <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#8A6A62', paddingBottom: 8, width: '36%' }}>
                      Zoom link
                    </td>
                    <td style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#241F1E', paddingBottom: 8, wordBreak: 'break-all' as const }}>
                      {counselor.zoom_link}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: '#FCEEE7', margin: '24px 0' }} />

          <Section>
            <Text style={{ color: '#8A6A62', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '0 0 6px', fontWeight: 'bold' }}>
              A few tips before you join:
            </Text>
            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', lineHeight: 1.5 }}>
              &bull; Join from a quiet, private space where you feel comfortable
            </Text>
            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', lineHeight: 1.5 }}>
              &bull; Test your audio and video a few minutes early
            </Text>
            <Text style={{ color: '#666', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', lineHeight: 1.5 }}>
              &bull; Have the link handy &mdash; it&apos;s unique to your counselor
            </Text>
          </Section>

          <Hr style={{ borderColor: '#FCEEE7', margin: '24px 0' }} />

          <Section style={{ background: '#FAF6F5', borderRadius: 6, padding: '14px 18px' }}>
            <Text style={{ color: '#8A6A62', fontSize: 13, fontFamily: 'Arial, sans-serif', margin: 0 }}>
              <strong>Questions?</strong> Call 985-264-8808 or email reconnectus@yahoo.com
            </Text>
          </Section>

          <Text style={{ color: '#8A6A62', fontSize: 13, marginTop: 28, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            &ldquo;As a man thinks in his heart, so is he.&rdquo; &mdash; Proverbs 23:7
          </Text>
          <Text style={{ color: '#E5C4B8', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
            No Heart Left Behind &copy; {new Date().getFullYear()}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
