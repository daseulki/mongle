import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/components/providers'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const kyoboHandwriting = localFont({
  src: '../../public/fonts/KyoboHandwriting-subset.woff2',
  variable: '--font-kyobo',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: true,
})


const nanumHandwriting2 = localFont({
  src: '../../public/fonts/나눔손글씨암스테르담.woff2',
  variable: '--font-nanum2',

  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
})


export const metadata: Metadata = {
  title: '몽글여행',
  description: '가족·친구와 함께하는 여행 앨범 & 일정 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '몽글여행',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#F5F0E8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html
      lang="ko"
      className={`${kyoboHandwriting.variable} ${nanumHandwriting2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
