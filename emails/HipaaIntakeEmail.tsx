import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Button
} from '@react-email/components'
import type { Client } from '../src/types'

interface Props { client: Client; intakeUrl: string }

export function HipaaIntakeEmail({ client, intakeUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Heading style={{ color: '#8B2015', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            Please complete your intake form
          </Heading>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Text style={{ color: '#3D1A14', fontFamily: 'Arial, sans-serif', fontSize: 14, lineHeight: 1.6 }}>
            Hi {client.first_name},
          </Text>
          <Text style={{ color: '#3D1A14', fontFamily: 'Arial, sans-serif', fontSize: 14, lineHeight: 1.6 }}>
            Thank you for booking a counseling session with us. Before your first visit, please take a few minutes to complete the confidential health intake form below.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={intakeUrl}
              style={{
                backgroundColor: '#B8311F', color: '#ffffff',
                fontFamily: 'Arial, sans-serif', fontWeight: 'bold',
                fontSize: 14, letterSpacing: '0.04em',
                padding: '14px 32px', borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Complete Intake Form &rarr;
            </Button>
          </Section>

          <Text style={{ color: '#9A5A50', fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.5 }}>
            This information is protected under HIPAA and will only be shared with your counselor. Completing it ahead of time helps us make the most of your session.
          </Text>

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
