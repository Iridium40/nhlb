import Link from 'next/link'

export const metadata = {
  title: 'Book a Session — No Heart Left Behind',
  description: 'Schedule affordable, faith-based counseling in Covington, LA.',
}

export default function BookLandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Let&apos;s Build Hope &amp; Healing TOGETHER!
      </div>

      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 80,
      }}>
        <a href="https://www.noheartleftbehind.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
            alt="No Heart Left Behind" style={{ height: 56, width: 'auto' }}
          />
        </a>
        <a href="https://www.noheartleftbehind.com/donate" target="_blank" rel="noopener noreferrer"
          style={{
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            letterSpacing: '0.06em', padding: '8px 20px', borderRadius: 4,
            textDecoration: 'none',
          }}>
          Donate
        </a>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
          }}>
            Book a Counseling Session
          </h1>
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '1rem', lineHeight: 1.7,
            color: 'var(--nhlb-muted)', margin: '0 0 40px',
          }}>
            Affordable, faith-based counseling for individuals, couples, and families.<br />
            430 N. Jefferson Ave, Covington, LA
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Link href="/book/new" style={{
              display: 'block', padding: '20px 24px',
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1rem',
              letterSpacing: '0.04em', borderRadius: 12, textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}>
              I&apos;m a New Client
              <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>
                First visit &mdash; in-person only
              </span>
            </Link>

            <Link href="/book/returning" style={{
              display: 'block', padding: '20px 24px',
              backgroundColor: 'white', color: 'var(--nhlb-red-dark)',
              border: '2px solid var(--nhlb-border)',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1rem',
              letterSpacing: '0.04em', borderRadius: 12, textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}>
              I&apos;m a Returning Client
              <span style={{ display: 'block', fontWeight: 400, fontSize: '0.8rem', color: 'var(--nhlb-muted)', marginTop: 4 }}>
                In-person or virtual
              </span>
            </Link>
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

      <footer style={{ backgroundColor: 'var(--nhlb-blush)', padding: '24px 48px', color: 'white' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', margin: 0 }}>
          No Heart Left Behind &copy; {new Date().getFullYear()} &ensp;&middot;&ensp; 985-264-8808 &ensp;&middot;&ensp; reconnectus@yahoo.com
        </p>
      </footer>
    </div>
  )
}
