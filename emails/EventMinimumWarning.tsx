import {
  Html, Head, Body, Container, Section,
  Text, Hr, Link
} from '@react-email/components'
import type { Event } from '../src/types'
import { format } from 'date-fns'

interface Props {
  event: Event
  currentCount: number
  baseUrl?: string
}

export function EventMinimumWarningEmail({ event, currentCount, baseUrl = 'https://nhlb.vercel.app' }: Props) {
  const needed = (event.min_capacity ?? 0) - currentCount
  const deadline = event.cancellation_deadline
    ? format(new Date(event.cancellation_deadline), 'EEEE, MMMM d \'at\' h:mm a')
    : 'the deadline'

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Text style={{ color: '#92400E', fontSize: 22, fontWeight: 'bold', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>
            ⚠ Event Below Minimum
          </Text>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind — Admin Alert
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Text style={{ color: '#3D1A14', fontSize: 15, lineHeight: '24px', fontFamily: 'Arial, sans-serif' }}>
            <strong>{event.title}</strong> is below its minimum attendance of {event.min_capacity}.
          </Text>

          <Section style={{ background: '#FEF3C7', borderRadius: 6, padding: '16px 20px', margin: '16px 0', border: '1px solid #FDE68A' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#92400E' }}>
              Current registrations: <strong>{currentCount}</strong>
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#92400E' }}>
              Minimum required: <strong>{event.min_capacity}</strong>
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#92400E' }}>
              Deadline: <strong>{deadline}</strong>
            </Text>
          </Section>

          <Text style={{ color: '#555', fontSize: 14, fontFamily: 'Arial, sans-serif', lineHeight: '22px' }}>
            If {needed} more {needed === 1 ? 'person does' : 'people do'} not register by the deadline,
            this event will be automatically cancelled and all registrants refunded.
          </Text>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section>
            <Link href={`${baseUrl}/admin/events`} style={{ color: '#B8311F', fontSize: 14, fontFamily: 'Arial, sans-serif', marginRight: 20 }}>
              View event registrations
            </Link>
          </Section>

          <Text style={{ color: '#D4A898', fontSize: 12, fontFamily: 'Arial, sans-serif', marginTop: 32 }}>
            No Heart Left Behind &copy; {new Date().getFullYear()}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
