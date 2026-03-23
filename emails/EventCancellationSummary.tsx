import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Link
} from '@react-email/components'
import type { Event } from '../src/types'
import { format } from 'date-fns'

interface Props {
  event: Event
  totalRegistrants: number
  refundsIssued: number
  refundsFailed: number
  totalRefundCents: number
  cancelledBy: string
  failedRefunds?: { name: string; email: string; amountCents: number }[]
  baseUrl?: string
}

export function EventCancellationSummaryEmail({
  event,
  totalRegistrants,
  refundsIssued,
  refundsFailed,
  totalRefundCents,
  cancelledBy,
  failedRefunds = [],
  baseUrl = 'https://nhlb.vercel.app',
}: Props) {
  const date = format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Georgia, serif', background: '#FDFAF8', padding: '40px 0' }}>
        <Container style={{ background: '#fff', borderRadius: 8, padding: '40px', maxWidth: 520 }}>
          <Text style={{ color: '#B8311F', fontSize: 22, fontWeight: 'bold', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>
            Event Cancelled — Summary
          </Text>
          <Text style={{ color: '#9A5A50', marginTop: 0, fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
            No Heart Left Behind — Admin Notification
          </Text>
          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Section>
            <Text style={{ color: '#3D1A14', fontSize: 15, margin: '4px 0' }}>
              <strong>Event:</strong> {event.title}
            </Text>
            <Text style={{ color: '#3D1A14', fontSize: 15, margin: '4px 0' }}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={{ color: '#3D1A14', fontSize: 15, margin: '4px 0' }}>
              <strong>Cancelled:</strong> {cancelledBy === 'auto' ? 'Automatically (minimum not met by deadline)' : 'Manually by admin'}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Heading style={{ color: '#3D1A14', fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 8 }}>
            Registration Summary
          </Heading>
          <Section style={{ background: '#F5F5F5', borderRadius: 6, padding: '16px 20px' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#333' }}>
              Total registrants notified: <strong>{totalRegistrants}</strong>
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#333' }}>
              Refunds issued successfully: <strong>{refundsIssued}</strong>
              {totalRefundCents > 0 && ` ($${(totalRefundCents / 100).toFixed(2)} total)`}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#333' }}>
              Free registrations: <strong>{totalRegistrants - refundsIssued - refundsFailed}</strong>
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: refundsFailed > 0 ? '#B8311F' : '#333' }}>
              Refunds failed: <strong>{refundsFailed}</strong>
            </Text>
          </Section>

          {failedRefunds.length > 0 && (
            <>
              <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />
              <Heading style={{ color: '#B8311F', fontFamily: 'Georgia, serif', fontSize: 16, marginBottom: 8 }}>
                Failed Refunds — Manual Action Required
              </Heading>
              {failedRefunds.map((r, i) => (
                <Text key={i} style={{ fontSize: 13, fontFamily: 'Arial, sans-serif', margin: '4px 0', color: '#333' }}>
                  • {r.name} ({r.email}) — ${(r.amountCents / 100).toFixed(2)}
                </Text>
              ))}
            </>
          )}

          <Hr style={{ borderColor: '#F0E0D8', margin: '24px 0' }} />

          <Link
            href={`${baseUrl}/admin/events`}
            style={{ color: '#B8311F', fontSize: 14, fontFamily: 'Arial, sans-serif' }}
          >
            View in dashboard →
          </Link>

          <Text style={{ color: '#D4A898', fontSize: 12, fontFamily: 'Arial, sans-serif', marginTop: 32 }}>
            No Heart Left Behind &copy; {new Date().getFullYear()}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
