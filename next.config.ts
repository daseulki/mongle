import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

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
  },
}

export default withSerwist(nextConfig)
