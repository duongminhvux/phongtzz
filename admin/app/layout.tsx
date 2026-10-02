import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Homestay Admin',
  description: 'Admin dashboard for homestay booking requests and website content',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
