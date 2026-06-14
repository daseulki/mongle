'use client'

import Image from 'next/image'
import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2Icon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { deletePhoto } from '@/actions/photo'
import { photoKeys } from '@/queries/keys'
import type { PhotoItem } from '@/queries/photos'

const LONG_PRESS_MS = 600

interface PhotoGridProps {
  photos: PhotoItem[]
  albumId: string
  myUserId: string
}

function groupByDate(photos: PhotoItem[]): { date: string; items: PhotoItem[] }[] {
  const map = new Map<string, PhotoItem[]>()
  for (const photo of photos) {
    const group = map.get(photo.date) ?? []
    group.push(photo)
    map.set(photo.date, group)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'M월 d일 (E)', { locale: ko })
  } catch {
    return dateStr
  }
}

export function PhotoGrid({ photos, albumId, myUserId }: PhotoGridProps): React.JSX.Element {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressActivated = useRef(false)

  const groups = groupByDate(photos)

  function startLongPress(photo: PhotoItem) {
    if (photo.uploadedBy !== myUserId) return
    longPressActivated.current = false
    longPressTimer.current = setTimeout(() => {
      longPressActivated.current = true
      setSelectedPhotoId(photo.id)
    }, LONG_PRESS_MS)
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handlePhotoTap(photo: PhotoItem) {
    if (longPressActivated.current) {
      longPressActivated.current = false
      return
    }
    if (selectedPhotoId) {
      setSelectedPhotoId(null)
      return
    }
    router.push(`/albums/${albumId}/photos/${photo.id}`)
  }

  function handleDelete(photo: PhotoItem) {
    setDeletingId(photo.id)
    startTransition(async () => {
      const result = await deletePhoto(albumId, photo.id)
      setDeletingId(null)
      if (result.success) {
        toast.success('사진이 삭제됐어요')
        setSelectedPhotoId(null)
        await queryClient.invalidateQueries({ queryKey: photoKeys.byAlbum(albumId) })
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
      onClick={() => { if (selectedPhotoId) setSelectedPhotoId(null) }}
    >
      {groups.map(({ date, items }) => (
        <section key={date}>
          <p
            style={{
              padding: '0 var(--page-padding)',
              marginBottom: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-ink-soft)',
            }}
          >
            {formatDate(date)}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
            }}
          >
            {items.map((photo) => {
              const isOwn = photo.uploadedBy === myUserId
              const isSelected = selectedPhotoId === photo.id
              const isDeleting = deletingId === photo.id

              return (
                <div
                  key={photo.id}
                  role="button"
                  tabIndex={0}
                  aria-label={isOwn ? '사진 (길게 눌러 삭제)' : '사진'}
                  style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                  onTouchStart={() => startLongPress(photo)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    if (isOwn) { setSelectedPhotoId(photo.id) }
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePhotoTap(photo)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePhotoTap(photo)
                  }}
                >
                  <Image
                    src={photo.cdnUrl}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 33vw, 200px"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />

                  {/* 삭제 오버레이 — 본인 사진 + 선택됨 */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={isDeleting || isPending}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(photo)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--color-terracotta)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 14px',
                          color: '#fff',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          cursor: isDeleting ? 'wait' : 'pointer',
                          opacity: isDeleting ? 0.7 : 1,
                        }}
                      >
                        <Trash2Icon size={14} />
                        {isDeleting ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function PhotoGridSkeleton(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {[0, 1].map((g) => (
        <section key={g}>
          <Skeleton className="h-4 w-20 mx-4 mb-3" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ aspectRatio: '1', borderRadius: 0 }} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
