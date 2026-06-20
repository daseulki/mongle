'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { ImagePlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { usePhotoUpload, type UploadedPhoto } from '@/queries/usePhotoUpload'
import { deletePhoto } from '@/actions/photo'
import { photoKeys } from '@/queries/keys'

interface PhotoAttachSectionProps {
  albumId: string
  date: string
  initialPhotos: UploadedPhoto[]
}

/**
 * Photo section of the daily record screen. Photos are uploaded immediately on
 * selection (no separate save) and tagged with the record's date.
 */
export function PhotoAttachSection({
  albumId,
  date,
  initialPhotos,
}: PhotoAttachSectionProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos)
  const [isDeleting, startDelete] = useTransition()
  const { upload, isPending } = usePhotoUpload(albumId)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? [])
    upload(files, date, ({ uploaded }) => {
      if (uploaded.length > 0) setPhotos((prev) => [...prev, ...uploaded])
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRemove(id: string): void {
    startDelete(async () => {
      const result = await deletePhoto(albumId, id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id))
      await queryClient.invalidateQueries({ queryKey: photoKeys.byAlbum(albumId) })
      toast.success('사진을 삭제했어요')
    })
  }

  const isBusy = isPending || isDeleting

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)' }}>
          사진
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
          추가하면 바로 저장돼요
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-2)',
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'var(--color-bg-surface)',
            }}
          >
            <Image
              src={photo.cdnUrl}
              alt=""
              fill
              sizes="25vw"
              style={{ objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              disabled={isBusy}
              aria-label="사진 삭제"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0, 0, 0, 0.55)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <XIcon size={14} color="#FFFFFF" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          aria-label="사진 추가"
          style={{
            aspectRatio: '1 / 1',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            background: 'var(--color-bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isBusy ? 'default' : 'pointer',
            opacity: isBusy ? 0.5 : 1,
            color: 'var(--color-ink-muted)',
          }}
        >
          <ImagePlusIcon size={22} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        aria-label="사진 선택"
        onChange={handleFileChange}
        disabled={isBusy}
      />
    </section>
  )
}
