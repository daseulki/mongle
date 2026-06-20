import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/components/providers'
import { BrandLogo } from '@/components/brand-logo'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const kyoboHandwriting = localFont({
  src: '../../public/fonts/KyoboHandwriting.woff2',
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


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mongle-rose.vercel.app'

const appTitle = '몽글여행'
const appDescription = '가족·친구와 함께하는 여행 앨범 & 일정 앱'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: appTitle,
  description: appDescription,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appTitle,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: appTitle,
    title: appTitle,
    description: appDescription,
    url: '/',
    // og:image는 app/opengraph-image.tsx 파일 컨벤션이 자동 생성
  },
  twitter: {
    card: 'summary_large_image',
    title: appTitle,
    description: appDescription,
    // twitter:image는 app/twitter-image.tsx 파일 컨벤션이 자동 생성
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
      <body className="min-h-full">
        <Providers>
          <div className="app-shell">
            <aside className="app-shell__aside" aria-hidden="true">
              <BrandLogo className="app-shell__logo" />
              <p className="app-shell__tagline">
                가족·친구와 함께하는
                <br />
                여행 앨범 &amp; 일정
              </p>
            </aside>
            <div className="app-shell__frame">{children}</div>
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
