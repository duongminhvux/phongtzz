import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Riverside Haven Admin',
  description: 'Riverside Haven admin dashboard for bookings, tours, rooms, media and website content',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
