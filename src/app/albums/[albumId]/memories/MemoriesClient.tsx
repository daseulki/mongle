'use client'

import Link from 'next/link'
import { ImageIcon, BookOpenIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useAlbumContext } from '../AlbumContext'
import { usePhotos } from '@/queries/photos'
import { useDiaryEntries } from '@/queries/diary'
import { PhotoGrid, PhotoGridSkeleton } from '@/components/photo/PhotoGrid'
import { PhotoUploadButton } from '@/components/photo/PhotoUploadButton'
import { DiaryCard } from '@/components/diary/DiaryCard'
import { Skeleton } from '@/components/ui/skeleton'

function DiarySkeleton(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function StorageGauge({ usedBytes, limitBytes }: { usedBytes: number; limitBytes: number }): React.JSX.Element {
  const pct = Math.min(100, Math.round((usedBytes / limitBytes) * 100))
  const isWarning = pct >= 80
  const isFull = pct >= 100

  const barColor = isFull
    ? 'var(--color-terracotta)'
    : isWarning
      ? 'var(--color-amber)'
      : 'var(--color-sage)'

  return (
    <div
      style={{
        padding: 'var(--space-3) var(--page-padding)',
        background: 'var(--color-bg-card)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--text-xs)',
          color: isFull ? 'var(--color-terracotta)' : 'var(--color-ink-soft)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <span>{formatBytes(usedBytes)} / {formatBytes(limitBytes)}</span>
        <span style={{ color: isWarning ? barColor : 'var(--color-ink-muted)' }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 4,
          background: 'var(--color-bg-surface)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

export function MemoriesClient(): React.JSX.Element {
  const { album, myUserId } = useAlbumContext()
  const today = format(new Date(), 'yyyy-MM-dd')
  const storageFull = album.storageUsedBytes >= album.storageLimitBytes

  const {
    data: photos,
    isLoading: photosLoading,
    isError: photosError,
    refetch: refetchPhotos,
  } = usePhotos(album.id)

  const {
    data: diaryEntries,
    isLoading: diaryLoading,
    isError: diaryError,
    refetch: refetchDiary,
  } = useDiaryEntries(album.id)

  const hasWrittenToday = diaryEntries?.some(
    (e) => e.userId === myUserId && e.date === today,
  )

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
        paddingBottom:
          'calc(var(--bottom-nav-height) + var(--space-6) + env(safe-area-inset-bottom))',
      }}
    >
      {/* 사진 섹션 */}
      <section>
        <div style={{ padding: 'var(--space-4) var(--page-padding) var(--space-3)' }}>
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--color-ink)',
            }}
          >
            사진
          </h2>
        </div>

        {photosLoading && <PhotoGridSkeleton />}

        {photosError && (
          <div
            className="flex flex-col items-center"
            style={{ padding: 'var(--space-8) var(--page-padding)' }}
          >
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--text-sm)' }}>
              사진을 불러오지 못했어요
            </p>
            <button
              type="button"
              onClick={() => refetchPhotos()}
              style={{
                color: 'var(--color-amber)',
                fontSize: 'var(--text-sm)',
                background: 'none',
                border: 'none',
                marginTop: 'var(--space-2)',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {!photosLoading && !photosError && photos?.length === 0 && (
          <div
            className="flex flex-col items-center justify-center text-center animate-fade-in"
            style={{ padding: 'var(--space-10) var(--page-padding)', gap: 'var(--space-4)' }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={28} style={{ color: 'var(--color-ink-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <p className="text-display-sm" style={{ color: 'var(--color-ink)' }}>
                아직 사진이 없어요
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
                아래 버튼으로 첫 사진을 올려보세요
              </p>
            </div>
          </div>
        )}

        {!photosLoading && !photosError && photos && photos.length > 0 && (
          <PhotoGrid photos={photos} albumId={album.id} myUserId={myUserId} />
        )}
      </section>

      {/* 여행 일기 섹션 */}
      <section style={{ padding: '0 var(--page-padding)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-3)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--color-ink)',
            }}
          >
            여행 일기
          </h2>
          {!hasWrittenToday && (
            <Link
              href={`/albums/${album.id}/diary/${today}/edit`}
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-amber)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              + 오늘 일기 쓰기
            </Link>
          )}
        </div>

        {diaryLoading && <DiarySkeleton />}

        {diaryError && (
          <div
            className="flex flex-col items-center"
            style={{ padding: 'var(--space-6) 0' }}
          >
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--text-sm)' }}>
              일기를 불러오지 못했어요
            </p>
            <button
              type="button"
              onClick={() => refetchDiary()}
              style={{
                color: 'var(--color-amber)',
                fontSize: 'var(--text-sm)',
                background: 'none',
                border: 'none',
                marginTop: 'var(--space-2)',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {!diaryLoading && !diaryError && diaryEntries?.length === 0 && (
          <div
            className="flex flex-col items-center text-center animate-fade-in"
            style={{ padding: 'var(--space-8) 0', gap: 'var(--space-4)' }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpenIcon size={28} style={{ color: 'var(--color-ink-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <p className="text-display-sm" style={{ color: 'var(--color-ink)' }}>
                아직 일기가 없어요
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
                오늘의 여행을 기록해보세요
              </p>
            </div>
          </div>
        )}

        {!diaryLoading && !diaryError && diaryEntries && diaryEntries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {diaryEntries.map((entry) => (
              <DiaryCard
                key={entry.id}
                entry={entry}
                isMyEntry={entry.userId === myUserId}
                albumId={album.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* FAB — 사진 업로드 */}
      <PhotoUploadButton albumId={album.id} disabled={storageFull} />

      {/* 용량 게이지 */}
      <StorageGauge
        usedBytes={album.storageUsedBytes}
        limitBytes={album.storageLimitBytes}
      />
    </main>
  )
}
