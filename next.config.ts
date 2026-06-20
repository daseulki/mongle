import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

// PWA(서비스워커)는 dev에서 비활성(아래 disable)이므로 Turbopack 미지원 경고는 무의미.
// 크로스플랫폼 위해 스크립트 대신 여기서 환경변수로 경고를 끈다.
process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = '1'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Disable PWA in development to avoid stale cache issues
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  allowedDevOrigins: ['192.168.75.124'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-d845ed50a9e44bddafaf95f6b63a043c.r2.dev',
      },
    ],
    // 사진 키는 타임스탬프 기반 불변 객체 → 최적화 이미지를 길게 캐시해도 안전.
    // 캐시 수명을 늘려 r2.dev 원본 재요청을 줄이고 재방문 로드를 빠르게 한다.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
}

export default withSerwist(nextConfig)
