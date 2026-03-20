import { createSupabaseAdminClient } from '@/lib/supabase'
import BookingFlow from '@/components/booking/BookingFlow'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Book a Session — No Heart Left Behind',
  description: 'Schedule affordable, faith-based counseling in Covington, LA.',
}

export default async function BookingPage() {
  const supabase = createSupabaseAdminClient()
  const { data: counselors } = await supabase
    .from('counselors')
    .select('*')
    .eq('is_active', true)
    .order('created_at')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>

      {/* Announcement bar */}
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)',
        color: 'white',
        textAlign: 'center',
        fontSize: '0.8rem',
        letterSpacing: '0.05em',
        padding: '8px 16px',
        fontFamily: 'Lato, sans-serif',
      }}>
        Let&apos;s Build Hope &amp; Healing TOGETHER!
      </div>

      {/* Nav header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 80,
      }}>
        <a href="https://www.noheartleftbehind.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
            alt="No Heart Left Behind"
            style={{ height: 56, width: 'auto' }}
          />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1rem',
            color: 'var(--nhlb-muted)',
            fontStyle: 'italic',
          }}>
            Counseling Booking
          </span>
          <a href="https://www.noheartleftbehind.com/donate" target="_blank" rel="noopener noreferrer"
            style={{
              backgroundColor: 'var(--nhlb-red)',
              color: 'white',
              fontFamily: 'Lato, sans-serif',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              padding: '8px 20px',
              borderRadius: 4,
              textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}>
            Donate
          </a>
        </div>
      </header>

      {/* Our New Home section */}
      <section style={{ backgroundColor: '#ECEAE6', padding: '56px 40px' }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 600,
          color: 'var(--nhlb-red-dark)',
          textAlign: 'center',
          margin: '0 0 40px',
          letterSpacing: '-0.01em',
        }}>
          Our New Home is Here!
        </h2>

        <div
          className="nhlb-new-home-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 32,
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/78a3dce7-5b04-48d9-862a-946178d23de2/Screenshot%2B2025-09-24%2Bat%2B12.00.22%2BAM.png"
            alt="NHLB office exterior at 430 N. Jefferson Ave, Covington, LA"
            style={{
              width: '100%', maxWidth: 380, height: 260,
              objectFit: 'cover', borderRadius: 6, display: 'block', justifySelf: 'end',
            }}
          />

          <div style={{ textAlign: 'center', maxWidth: 340, padding: '0 8px' }}>
            <p style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: '1rem',
              lineHeight: 1.75,
              color: 'var(--nhlb-text)',
              margin: '0 0 20px',
            }}>
              No Heart Left Behind has found a place to build hope and healing in downtown Covington! This new home allows us to expand affordable, faith-based counseling and family support for our community.
            </p>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--nhlb-red-dark)',
              margin: 0,
            }}>
              430 N. Jefferson Ave., Covington, LA
            </p>
            <a
              href="https://maps.google.com/?q=430+N+Jefferson+Ave+Covington+LA+70433"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 14,
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--nhlb-red)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--nhlb-blush)',
                paddingBottom: 2,
              }}
            >
              View on map &rarr;
            </a>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/2d1616a5-2293-4302-9a0b-440fd9322ef4/Untitled+design+%2811%29.png"
            alt="NHLB counseling office interior — welcoming waiting room"
            style={{
              width: '100%', maxWidth: 380, height: 260,
              objectFit: 'cover', borderRadius: 6, display: 'block', justifySelf: 'start',
            }}
          />
        </div>
      </section>

      {/* Main booking flow */}
      <main style={{ flex: 1 }}>
        <BookingFlow counselors={counselors ?? []} />
      </main>

      {/* Footer */}
      <footer>
        <div style={{
          backgroundColor: 'var(--nhlb-blush)',
          padding: '40px 48px',
          color: 'white',
        }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', marginBottom: 8 }}>Contact Us:</p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', marginBottom: 4 }}>Phone: 985-264-8808</p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', marginBottom: 4 }}>
            Email: reconnectus@yahoo.com or astickles@noheartleftbehind.com
          </p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem' }}>
            Counseling Office: 430 N. Jefferson Ave, Covington, LA 70433
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: 'var(--nhlb-red)',
            fontSize: '1rem',
            margin: 0,
          }}>
            No Heart Left Behind &copy; {new Date().getFullYear()}
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              ['Our Mission', 'https://www.noheartleftbehind.com/who-we-are'],
              ['Counseling', 'https://www.noheartleftbehind.com/counseling'],
              ['Events', 'https://www.noheartleftbehind.com/events'],
              ['Donate', 'https://www.noheartleftbehind.com/donate'],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.8rem',
                color: 'var(--nhlb-red)',
                textDecoration: 'none',
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
