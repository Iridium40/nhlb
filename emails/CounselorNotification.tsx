import {
  Html, Head, Body, Container, Text, Heading, Hr, Section
} from '@react-email/components'
import type { Booking, Counselor, Client } from '../src/types'
import { format } from 'date-fns'

interface Props { booking: Booking; counselor: Counselor; client: Client }

export function CounselorNotificationEmail({ booking, counselor, client }: Props) {
  const date = format(new Date(booking.scheduled_at), 'EEEE, MMMM d, yyyy')
  const time = format(new Date(booking.scheduled_at), 'h:mm a')

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#f4f4f4', padding: '32px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '32px', maxWidth: 480 }}>
          <Heading style={{ fontSize: 20, marginBottom: 4, color: '#8B2015' }}>New booking request</Heading>
          <Text style={{ color: '#666', marginTop: 0 }}>Assigned to {counselor.name}</Text>
          <Hr style={{ margin: '20px 0' }} />

          <Section>
            <Text style={{ margin: '4px 0' }}><strong>Client:</strong> {client.first_name} {client.last_name}</Text>
            <Text style={{ margin: '4px 0' }}><strong>Email:</strong> {client.email}</Text>
            {client.phone && <Text style={{ margin: '4px 0' }}><strong>Phone:</strong> {client.phone}</Text>}
            <Text style={{ margin: '4px 0' }}><strong>Service:</strong> {client.service_type}</Text>
            <Text style={{ margin: '4px 0' }}>
              <strong>Format:</strong> {booking.type === 'VIRTUAL' ? '💻 Virtual' : '📍 In Person'}
            </Text>
            <Hr style={{ margin: '16px 0' }} />
            <Text style={{ margin: '4px 0' }}><strong>Date:</strong> {date} at {time}</Text>
            {booking.donation_amount_cents > 0 && (
              <Text style={{ margin: '4px 0' }}><strong>Donation:</strong> ${(booking.donation_amount_cents / 100).toFixed(2)}</Text>
            )}
            {client.brief_reason && (
              <>
                <Hr style={{ margin: '16px 0' }} />
                <Text style={{ margin: '4px 0' }}><strong>Reason for seeking counseling:</strong></Text>
                <Text style={{ color: '#444', background: '#f9f9f9', padding: '10px', borderRadius: 4 }}>
                  {client.brief_reason}
                </Text>
              </>
            )}
          </Section>

          <Hr style={{ margin: '20px 0' }} />
          <Text style={{ color: '#999', fontSize: 12 }}>
            Booking ID: {booking.id}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
