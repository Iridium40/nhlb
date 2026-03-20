import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'No Heart Left Behind — Counseling',
  description: 'Affordable, faith-based counseling in Covington, LA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
