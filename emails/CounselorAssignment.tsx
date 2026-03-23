import {
  Html, Head, Body, Container, Section, Img,
  Text, Heading, Hr, Row, Column, Link
} from '@react-email/components'
import type { Counselor, Client, Booking } from '../src/types'
import { format } from 'date-fns'

interface Props {
  counselor: Counselor
  client: Client
  upcomingSessions: Booking[]
  isReassignment: boolean
  baseUrl?: string
}

export function CounselorAssignmentEmail({
  counselor,
  client,
  upcomingSessions,
  isReassignment,
  baseUrl = 'https://nhlb.vercel.app',
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Heading style={{ color: '#8B2015', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            {isReassignment ? 'Your counselor has been updated' : 'Meet your counselor'}
          </Heading>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Text style={{ color: '#3D1A14', fontSize: 14, fontFamily: 'Arial, sans-serif', lineHeight: '22px', margin: '0 0 20px' }}>
            Hi {client.first_name},
          </Text>

          <Text style={{ color: '#3D1A14', fontSize: 14, fontFamily: 'Arial, sans-serif', lineHeight: '22px', margin: '0 0 24px' }}>
            {isReassignment
              ? 'We wanted to let you know that your counselor assignment has been updated. Your new counselor is ready to support you on your journey.'
              : 'We\'re excited to introduce you to your assigned counselor! They\'ll be working with you throughout your sessions.'}
          </Text>

          {/* Counselor Card */}
          <Section style={{ background: '#FDFAF8', borderRadius: 8, padding: '24px', border: '1px solid #F0E0D8', marginBottom: 24 }}>
            <Row>
              {counselor.photo_url && (
                <Column style={{ width: 80, verticalAlign: 'top' }}>
                  <Img
                    src={counselor.photo_url}
                    alt={counselor.name}
                    width={72}
                    height={72}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #F0E0D8' }}
                  />
                </Column>
              )}
              <Column style={{ verticalAlign: 'top', paddingLeft: counselor.photo_url ? 12 : 0 }}>
                <Text style={{ color: '#8B2015', fontSize: 18, fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: '0 0 2px' }}>
                  {counselor.name}
                </Text>
                {counselor.title && (
                  <Text style={{ color: '#9A5A50', fontSize: 14, margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }}>
                    {counselor.title}
                  </Text>
                )}
                {counselor.bio && (
                  <Text style={{ color: '#555', fontSize: 13, margin: 0, lineHeight: '20px', fontFamily: 'Arial, sans-serif' }}>
                    {counselor.bio.length > 200 ? counselor.bio.slice(0, 200) + '...' : counselor.bio}
                  </Text>
                )}
              </Column>
            </Row>
          </Section>

          {/* Zoom details if available */}
          {counselor.zoom_link && (
            <Section style={{ background: '#F5EDE8', borderRadius: 6, padding: '16px 20px', border: '1px solid #F0E0D8', marginBottom: 24 }}>
              <Text style={{ color: '#8B2015', fontSize: 14, fontWeight: 'bold', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
                💻 Virtual Session Details
              </Text>
              <Text style={{ color: '#555', fontSize: 13, margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
                <strong>Join link:</strong>{' '}
                <a href={counselor.zoom_link} style={{ color: '#B8311F' }}>{counselor.zoom_link}</a>
              </Text>
              {counselor.zoom_meeting_id && (
                <Text style={{ color: '#555', fontSize: 13, margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>
                  <strong>Meeting ID:</strong> {counselor.zoom_meeting_id}
                </Text>
              )}
              {counselor.zoom_passcode && (
                <Text style={{ color: '#555', fontSize: 13, margin: '4px 0 0', fontFamily: 'Arial, sans-serif' }}>
                  <strong>Passcode:</strong> {counselor.zoom_passcode}
                </Text>
              )}
            </Section>
          )}

          {/* Upcoming sessions */}
          {upcomingSessions.length > 0 && (
            <>
              <Text style={{ color: '#9A5A50', fontSize: 12, fontWeight: 'bold', letterSpacing: '0.06em', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }}>
                YOUR UPCOMING SESSIONS
              </Text>
              {upcomingSessions.map((session) => (
                <Section key={session.id} style={{ background: '#EAF5EE', borderRadius: 6, padding: '12px 16px', marginBottom: 8 }}>
                  <Row>
                    <Column>
                      <Text style={{ color: '#065F46', fontSize: 14, fontWeight: 'bold', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                        {format(new Date(session.scheduled_at), 'EEEE, MMMM d, yyyy')}
                      </Text>
                      <Text style={{ color: '#065F46', fontSize: 13, margin: '2px 0 0', fontFamily: 'Arial, sans-serif' }}>
                        {format(new Date(session.scheduled_at), 'h:mm a')} &middot; {session.type === 'VIRTUAL' ? '💻 Virtual' : '📍 In Person'}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}
              <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />
            </>
          )}

          <Section>
            <Text style={{ color: '#555', fontSize: 13, fontFamily: 'Arial, sans-serif', lineHeight: '20px' }}>
              If you have any questions, feel free to call us at <strong>985-264-8808</strong> or
              email <a href="mailto:reconnectus@yahoo.com" style={{ color: '#B8311F' }}>reconnectus@yahoo.com</a>.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: 24 }}>
            <Link
              href={`${baseUrl}/book`}
              style={{
                display: 'inline-block', padding: '12px 28px',
                backgroundColor: '#B8311F', color: '#fff', borderRadius: 6,
                fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial, sans-serif',
                textDecoration: 'none',
              }}
            >
              Book a Session
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
