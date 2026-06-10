import {
  Html, Head, Body, Container, Section, Img,
  Text, Heading, Hr, Button
} from '@react-email/components'
import type { Client } from '../src/types'

interface Props { client: Client; intakeUrl: string }

export function HipaaIntakeEmail({ client, intakeUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FAF6F5', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Section style={{ backgroundColor: '#763535', borderRadius: 8, padding: '20px 24px', textAlign: 'center', marginBottom: 24 }}>
            <Img src="https://rgssitykmtunydrbuuhc.supabase.co/storage/v1/object/public/NHLB_Images/No-Heart-Left-Behind-Horizontal-White.svg" alt="No Heart Left Behind" width="220" style={{ margin: '0 auto', display: 'block' }} />
          </Section>
          <Heading style={{ color: '#763535', fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>
            Please complete your intake form
          </Heading>
          <Text style={{ color: '#8A6A62', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind &mdash; Faith-Based Counseling
          </Text>
          <Hr style={{ borderColor: '#FCEEE7', margin: '24px 0' }} />

          <Text style={{ color: '#241F1E', fontFamily: 'Arial, sans-serif', fontSize: 14, lineHeight: 1.6 }}>
            Hi {client.first_name},
          </Text>
          <Text style={{ color: '#241F1E', fontFamily: 'Arial, sans-serif', fontSize: 14, lineHeight: 1.6 }}>
            Thank you for scheduling a counseling session with us. Before your first visit, please take a few minutes to complete the confidential health intake form below.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button
              href={intakeUrl}
              style={{
                backgroundColor: '#A90113', color: '#ffffff',
                fontFamily: 'Arial, sans-serif', fontWeight: 'bold',
                fontSize: 14, letterSpacing: '0.04em',
                padding: '14px 32px', borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Complete Intake Form &rarr;
            </Button>
          </Section>

          <Text style={{ color: '#8A6A62', fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.5 }}>
            This information is protected under HIPAA and will only be shared with your counselor. Completing it ahead of time helps us make the most of your session.
          </Text>

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
