'use client'

import Link from 'next/link'
import { PlusIcon, MapIcon, UserCircleIcon } from 'lucide-react'
import { useAlbums } from '@/queries/albums'
import { AlbumCard } from '@/components/album/AlbumCard'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, buttonVariants } from '@/components/ui/button'
import { MongleMascot } from '@/components/brand-logo'

function AlbumListSkeleton(): React.JSX.Element {
  return (
    <div
      className="page-content"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* 커버 스켈레톤 */}
          <Skeleton
            className="w-full"
            style={{ aspectRatio: '16/7', borderRadius: 0 }}
          />
          {/* 텍스트 스켈레톤 */}
          <div
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'var(--space-2)',
              }}
            >
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState(): React.JSX.Element {
  return (
    <div
      className="page-content flex flex-col items-center justify-center text-center animate-fade-in"
      style={{
        minHeight: 'calc(100dvh - var(--header-height))',
        gap: 'var(--space-5)',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MapIcon size={36} style={{ color: 'var(--color-ink-muted)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <p
          className="text-display-md"
          style={{ color: 'var(--color-ink)' }}
        >
          아직 여행 앨범이 없어요
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
          새 앨범을 만들고 여행을 기록해보세요
        </p>
      </div>
      <Link href="/albums/new" className={buttonVariants()}>
        첫 앨범 만들기
      </Link>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.JSX.Element {
  return (
    <div
      className="page-content flex flex-col items-center justify-center text-center"
      style={{
        minHeight: 'calc(100dvh - var(--header-height))',
        gap: 'var(--space-4)',
      }}
    >
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-soft)' }}>
        앨범을 불러오는 데 실패했어요
      </p>
      <Button variant="secondary" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  )
}

export function HomeClient(): React.JSX.Element {
  const { data: albums, isLoading, isError, refetch } = useAlbums()

  return (
    <AppLayout>
      {/* 헤더 */}
      <header className="page-header">
        <h1 style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center' }}>
          {/* 몽글여행 로고 — 클릭 시 홈(앨범 목록)으로 이동 */}
          <Link
            href="/"
            aria-label="몽글여행 홈"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <MongleMascot style={{ height: 50, width: 'auto' }} />
            <span
              style={{
                fontFamily: 'var(--font-kyobo), cursive',
                fontSize: 'var(--text-d-md)',
                lineHeight: 1,
                color: 'var(--color-ink)',
              }}
            >
              몽글여행
            </span>
          </Link>
        </h1>
        <Link
          href="/settings/profile"
          aria-label="프로필 설정"
          style={{
            width: 'var(--touch-min)',
            height: 'var(--touch-min)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-full)',
            color: 'var(--color-ink-soft)',
          }}
        >
          <UserCircleIcon size={28} />
        </Link>
      </header>

      {/* 콘텐츠 — 4가지 상태 */}
      {isLoading && <AlbumListSkeleton />}

      {isError && <ErrorState onRetry={refetch} />}

      {!isLoading && !isError && albums?.length === 0 && <EmptyState />}

      {!isLoading && !isError && albums && albums.length > 0 && (
        <main
          className="page-content"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {albums.map((album, index) => (
            <div
              key={album.id}
              className={`stagger-${Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5}`}
            >
              <AlbumCard {...album} />
            </div>
          ))}
        </main>
      )}

      {/* FAB — 앨범 생성 */}
      {!isLoading && !isError && (
        <div className="fab-container">
          <Link
            href="/albums/new"
            className="fab"
            aria-label="새 앨범 만들기"
          >
            <PlusIcon size={26} color="#FFFFFF" className="fab__icon" />
          </Link>
        </div>
      )}
    </AppLayout>
  )
}
