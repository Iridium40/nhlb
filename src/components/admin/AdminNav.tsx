'use client'

import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin/bookings', label: 'Sessions' },
  { href: '/admin/schedule', label: 'Schedule' },
  { href: '/admin/bookings/clients', label: 'Clients' },
  { href: '/admin/bookings/counselors', label: 'Counselors' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/donations', label: 'Donations' },
  { href: '/admin/reports', label: 'Reports' },
]

export default function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin/bookings') return pathname === '/admin/bookings'
    return pathname.startsWith(href)
  }

  return (
    <>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Admin
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: 64, position: 'relative',
      }}>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <a key={item.href} href={item.href} style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700,
                color: active ? 'var(--nhlb-red-dark)' : 'var(--nhlb-muted)',
                textDecoration: 'none',
                borderBottom: active ? '2px solid var(--nhlb-red-dark)' : '2px solid transparent',
                padding: '20px 4px',
                transition: 'color 0.12s, border-color 0.12s',
              }}>
                {item.label}
              </a>
            )
          })}
        </nav>
        <a href="/book" target="_blank" rel="noopener noreferrer" style={{
          position: 'absolute', right: 40, fontFamily: 'Lato, sans-serif',
          fontSize: '0.75rem', fontWeight: 700, color: 'white',
          backgroundColor: 'var(--nhlb-red)', padding: '6px 14px',
          borderRadius: 6, textDecoration: 'none',
        }}>
          Book a Session ↗
        </a>
      </header>
    </>
  )
}
