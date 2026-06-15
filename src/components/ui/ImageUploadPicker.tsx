'use client'

import { useRef, useState } from 'react'
import { CameraIcon, LoaderIcon } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { resizeCover, resizeAvatar } from '@/lib/image/resize'

const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif'

interface ImageUploadPickerProps {
  type: 'cover' | 'avatar'
  /** Current CDN URL (may be null for new items) */
  currentUrl: string | null
  /** Called with the new CDN URL after a successful upload */
  onChange: (url: string) => void
  /** For cover type only: required to validate album membership */
  albumId?: string
  /** Aspect ratio CSS string, e.g. "16/7" for cover, "1" for avatar */
  aspectRatio?: string
  /** Size in px for round avatar (used when type=avatar) */
  avatarSize?: number
}

export function ImageUploadPicker({
  type,
  currentUrl,
  onChange,
  albumId,
  aspectRatio = type === 'avatar' ? '1' : '16/7',
  avatarSize = 80,
}: ImageUploadPickerProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) return
    inputRef.current.value = ''
    if (!file) return

    setUploading(true)
    try {
      const resized = type === 'avatar'
        ? await resizeAvatar(file)
        : await resizeCover(file)

      const body = new FormData()
      body.append('file', resized)
      body.append('type', type)
      if (type === 'cover' && albumId) body.append('albumId', albumId)

      const res = await fetch('/api/images/upload', { method: 'POST', body })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        toast.error(err.error ?? '이미지 업로드에 실패했어요')
        return
      }

      const { publicUrl } = (await res.json()) as { publicUrl: string }
      setPreview(publicUrl)
      onChange(publicUrl)
    } catch {
      toast.error('이미지 처리 중 오류가 발생했어요')
    } finally {
      setUploading(false)
    }
  }

  if (type === 'avatar') {
    return (
      <div
        style={{
          position: 'relative',
          width: avatarSize,
          height: avatarSize,
          flexShrink: 0,
          cursor: uploading ? 'wait' : 'pointer',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: 'var(--radius-4xl)',
            overflow: 'hidden',
            background: 'var(--color-bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="프로필 이미지"
              width={avatarSize}
              height={avatarSize}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <CameraIcon size={avatarSize * 0.35} style={{ color: 'var(--color-ink-muted)' }} />
          )}
        </div>

        {/* 카메라 오버레이 */}
        <div
          aria-label="프로필 이미지 변경"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--color-amber)',
            border: '2px solid var(--color-bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading
            ? <LoaderIcon size={13} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            : <CameraIcon size={13} color="#fff" />
          }
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          aria-label="프로필 이미지 선택"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>
    )
  }

  // type === 'cover'
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-surface)',
        cursor: uploading ? 'wait' : 'pointer',
        border: '2px dashed var(--color-border)',
      }}
      role="button"
      tabIndex={0}
      aria-label="커버 이미지 선택"
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click() }}
    >
      {preview ? (
        <Image
          src={preview}
          alt="앨범 커버"
          fill
          sizes="(max-width: 600px) 100vw, 480px"
          style={{ objectFit: 'cover' }}
        />
      ) : null}

      {/* 오버레이 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          background: preview ? 'rgba(0,0,0,0.3)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        {uploading ? (
          <LoaderIcon size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <>
            <CameraIcon size={22} style={{ color: preview ? '#fff' : 'var(--color-ink-muted)' }} />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: preview ? '#fff' : 'var(--color-ink-muted)',
              }}
            >
              {preview ? '커버 이미지 변경' : '커버 이미지 선택 (선택 사항)'}
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        aria-label="커버 이미지 선택"
        onChange={handleFile}
        disabled={uploading}
      />
    </div>
  )
}
