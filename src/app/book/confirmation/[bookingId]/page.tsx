import { createSupabaseAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import CreateAccountCard from '@/components/booking/CreateAccountCard'

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const supabase = createSupabaseAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, client:clients(*), counselor:counselors(*)')
    .eq('id', bookingId)
    .single()

  if (!booking) notFound()

  const date = format(new Date(booking.scheduled_at), 'EEEE, MMMM d, yyyy')
  const time = format(new Date(booking.scheduled_at), 'h:mm a')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Booking Confirmed
      </div>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          {/* Check circle */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EAF5EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2D7A4F" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
          }}>
            You&apos;re all set!
          </h1>
          <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 4 }}>
            A confirmation has been sent to
          </p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-red-dark)', marginBottom: 24 }}>
            {booking.client?.email}
          </p>

          {/* Session details card */}
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '24px', textAlign: 'left', marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>DATE</p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-text)', margin: 0 }}>{date}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>TIME</p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-text)', margin: 0 }}>{time}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>COUNSELOR</p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-text)', margin: 0 }}>{booking.counselor?.name}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>FORMAT</p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-text)', margin: 0 }}>
                  {booking.type === 'VIRTUAL' ? '💻 Virtual' : '🏠 In Person'}
                </p>
              </div>
            </div>

            {booking.type === 'IN_PERSON' && (
              <div style={{ borderTop: '1px solid var(--nhlb-border)', paddingTop: 16 }}>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
                  📍 430 N. Jefferson Ave, Covington, LA 70433
                </p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
                  📞 985-264-8808
                </p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: 0 }}>
                  ✉️ reconnectus@yahoo.com
                </p>
              </div>
            )}

            {booking.type === 'VIRTUAL' && booking.counselor?.zoom_link && (
              <div style={{ borderTop: '1px solid var(--nhlb-border)', paddingTop: 16 }}>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: '0 0 8px' }}>
                  💻 Your virtual session link will be emailed before your appointment.
                </p>
              </div>
            )}
          </div>

          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)',
            marginBottom: 32, lineHeight: 1.6,
          }}>
            Please check your email for a HIPAA intake form. Completing it before your session helps us serve you better.
          </p>

          {!booking.client?.supabase_user_id && (
            <div style={{ marginBottom: 32 }}>
              <CreateAccountCard clientId={booking.client_id} email={booking.client?.email ?? ''} />
            </div>
          )}

          <a href="/book" style={{
            display: 'inline-block', padding: '12px 28px',
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
            borderRadius: 8, textDecoration: 'none',
          }}>
            Book Another Session
          </a>

          <div style={{
            marginTop: 32, padding: '16px 20px',
            background: '#FDFAF8', border: '1px solid var(--nhlb-border)',
            borderRadius: 8, textAlign: 'left',
          }}>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
              Need to cancel? You may cancel online up to 24 hours before your appointment.
              For cancellations within 24 hours, please call <strong style={{ color: 'var(--nhlb-red-dark)' }}>985-264-8808</strong>.
            </p>
            <a href={`/book/cancel?id=${bookingId}&email=${encodeURIComponent(booking.client?.email ?? '')}`} style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--nhlb-red)', textDecoration: 'underline',
            }}>
              Cancel this appointment
            </a>
          </div>

          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '1rem', color: 'var(--nhlb-muted)', marginTop: 48,
          }}>
            &ldquo;As a man thinks in his heart, so is he.&rdquo;<br />
            <span style={{ fontSize: '0.85rem' }}>&mdash; Proverbs 23:7</span>
          </p>
        </div>
      </main>
    </div>
  )
}
