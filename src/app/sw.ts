/// <reference lib="WebWorker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /\/_next\/static\/.*/i,
      handler: new CacheFirst({
        cacheName: 'next-static',
        plugins: [{ cacheKeyWillBeUsed: async ({ request }) => request }],
      }),
    },
    {
      // Vercel 이미지 최적화 경로 — 실제 화면 사진은 /_next/image 로 나간다
      matcher: /\/_next\/image\?/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'next-image',
      }),
    },
    {
      // R2 원본 직접 로드(사진 상세 등)
      matcher: new RegExp(`^${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? 'https://PLACEHOLDER'}`),
      handler: new StaleWhileRevalidate({
        cacheName: 'r2-photos',
      }),
    },
    {
      // API routes — network-first
      matcher: /^\/api\/.*/i,
      handler: new NetworkFirst({
        cacheName: 'api-routes',
      }),
    },
  ],
})

serwist.addEventListeners()
