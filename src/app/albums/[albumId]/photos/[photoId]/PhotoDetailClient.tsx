'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeftIcon, DownloadIcon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { usePhotos } from '@/queries/photos'
import { useAlbumContext } from '../../AlbumContext'
import { deletePhoto } from '@/actions/photo'
import { photoKeys } from '@/queries/keys'
import { Skeleton } from '@/components/ui/skeleton'

interface PhotoDetailClientProps {
  albumId: string
  photoId: string
}

export function PhotoDetailClient({ albumId, photoId }: PhotoDetailClientProps): React.JSX.Element {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { myUserId } = useAlbumContext()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: photos, isLoading } = usePhotos(albumId)

  const currentIndex = photos?.findIndex((p) => p.id === photoId) ?? -1
  const photo = photos?.[currentIndex]
  const prevPhoto = currentIndex > 0 ? photos?.[currentIndex - 1] : null
  const nextPhoto = photos && currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null

  // Touch swipe
  const touchStartX = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 60) return
    if (dx < 0 && nextPhoto) {
      router.replace(`/albums/${albumId}/photos/${nextPhoto.id}`)
    } else if (dx > 0 && prevPhoto) {
      router.replace(`/albums/${albumId}/photos/${prevPhoto.id}`)
    }
  }

  function handleDelete() {
    if (!photo) return
    startTransition(async () => {
      const result = await deletePhoto(albumId, photo.id)
      if (result.success) {
        toast.success('사진이 삭제됐어요')
        await queryClient.invalidateQueries({ queryKey: photoKeys.byAlbum(albumId) })
        router.replace(`/albums/${albumId}/memories`)
      } else {
        toast.error(result.error)
        setShowDeleteConfirm(false)
      }
    })
  }

  const isOwnPhoto = photo?.uploadedBy === myUserId

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 상단 툴바 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(env(safe-area-inset-top) + 12px) 16px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로가기"
          style={{
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', borderRadius: '50%',
          }}
        >
          <ArrowLeftIcon size={22} />
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {photo && (
            <a
              href={photo.cdnUrl}
              download
              aria-label="사진 다운로드"
              style={{
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#fff', borderRadius: '50%', textDecoration: 'none',
              }}
            >
              <DownloadIcon size={20} />
            </a>
          )}
          {photo && isOwnPhoto && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="사진 삭제"
              style={{
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#fff', borderRadius: '50%',
              }}
            >
              <Trash2Icon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 사진 영역 */}
      <div
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0, background: '#111' }} />
        ) : !photo ? (
          <p style={{ color: '#888', fontSize: 14 }}>사진을 찾을 수 없어요</p>
        ) : (
          <Image
            src={photo.cdnUrl}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'contain' }}
            priority
          />
        )}

        {/* 좌우 화살표 — 태블릿/데스크톱 */}
        {prevPhoto && (
          <button
            type="button"
            onClick={() => router.replace(`/albums/${albumId}/photos/${prevPhoto.id}`)}
            aria-label="이전 사진"
            style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
              color: '#fff', borderRadius: '50%',
            }}
          >
            <ChevronLeftIcon size={24} />
          </button>
        )}
        {nextPhoto && (
          <button
            type="button"
            onClick={() => router.replace(`/albums/${albumId}/photos/${nextPhoto.id}`)}
            aria-label="다음 사진"
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
              color: '#fff', borderRadius: '50%',
            }}
          >
            <ChevronRightIcon size={24} />
          </button>
        )}
      </div>

      {/* 페이지 인디케이터 */}
      {photos && photos.length > 1 && currentIndex >= 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 6,
          }}
        >
          {photos.length <= 20 && photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'width 0.2s ease',
              }}
            />
          ))}
          {photos.length > 20 && (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {currentIndex + 1} / {photos.length}
            </span>
          )}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-photo-title"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, zIndex: 20,
          }}
          onClick={() => !isPending && setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 24,
              maxWidth: 320, width: '100%',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 id="delete-photo-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
                사진을 삭제할까요?
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)' }}>
                삭제된 사진은 복구할 수 없어요.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-terracotta)', border: 'none',
                  color: '#fff', fontSize: 'var(--text-base)', fontWeight: 600,
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? '삭제 중...' : '삭제'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                style={{
                  height: 48, borderRadius: 'var(--radius-md)',
                  background: 'none', border: 'none',
                  color: 'var(--color-ink-soft)', fontSize: 'var(--text-base)',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
