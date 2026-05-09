import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Checklist Xe Nâng | Forklift Safety Checklist',
  description: 'Hệ thống kiểm tra an toàn xe nâng hàng ngày',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans bg-slate-50 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
