'use client'

import { useRef, useTransition } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { resizePhoto } from '@/lib/image/resize'
import { insertPhoto } from '@/actions/photo'
import { photoKeys } from '@/queries/keys'

const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

interface PhotoUploadButtonProps {
  albumId: string
  disabled?: boolean
}

export function PhotoUploadButton({ albumId, disabled = false }: PhotoUploadButtonProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const allFiles = Array.from(e.target.files ?? [])
    if (allFiles.length === 0) return

    // 최대 10장 제한
    if (allFiles.length > MAX_FILES) {
      toast.error(`한 번에 최대 ${MAX_FILES}장까지 업로드할 수 있어요`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // 파일별 사전 검증 (타입·크기)
    const valid: File[] = []
    const skipped: string[] = []

    for (const file of allFiles) {
      const typeOk = ACCEPTED_TYPES.has(file.type.toLowerCase())
      const sizeOk = file.size <= MAX_FILE_SIZE_BYTES
      if (!typeOk || !sizeOk) {
        skipped.push(file.name)
      } else {
        valid.push(file)
      }
    }

    if (skipped.length > 0) {
      toast.error(`${skipped.length}개 파일을 제외했어요 (지원 형식: JPEG·PNG·WEBP·HEIC, 최대 20 MB)`)
    }
    if (valid.length === 0) {
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    startTransition(async () => {
      let successCount = 0
      let failCount = 0

      for (const file of valid) {
        try {
          const resized = await resizePhoto(file)
          const today = format(new Date(), 'yyyy-MM-dd')

          const res = await fetch('/api/photos/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              albumId,
              fileName: resized.name,
              fileType: resized.type,
              fileSizeBytes: resized.size,
            }),
          })

          if (!res.ok) {
            const body = (await res.json()) as { error?: string }
            if (body.error?.includes('용량')) {
              toast.error('앨범 용량(5GB)이 가득 찼어요. 사진을 정리해주세요')
              break // 남은 파일 중단
            }
            toast.error(body.error ?? '사진 업로드에 실패했어요')
            failCount++
            continue
          }

          const { presignedUrl, storageKey, publicUrl } = (await res.json()) as {
            presignedUrl: string
            storageKey: string
            publicUrl: string
          }

          const putRes = await fetch(presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': resized.type },
            body: resized,
          })

          if (!putRes.ok) {
            toast.error('R2 업로드에 실패했어요')
            failCount++
            continue
          }

          const result = await insertPhoto({
            albumId,
            date: today,
            storageKey,
            cdnUrl: publicUrl,
            fileSizeBytes: resized.size,
          })

          if (!result.success) {
            toast.error(result.error)
            failCount++
          } else {
            successCount++
          }
        } catch {
          failCount++
        }
      }

      if (successCount > 0) {
        await queryClient.invalidateQueries({ queryKey: photoKeys.byAlbum(albumId) })
        toast.success(`${successCount}장 업로드 완료`)
      }
      if (failCount > 0) {
        toast.error(`${failCount}장 업로드 실패`)
      }

      if (inputRef.current) inputRef.current.value = ''
    })
  }

  const isDisabled = disabled || isPending

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        aria-label="사진 선택"
        onChange={handleFileChange}
        disabled={isDisabled}
      />
      <div className="fab-container">
        <button
          type="button"
          className="fab"
          aria-label={
            disabled
              ? '앨범 용량이 가득 찼어요'
              : isPending
                ? '업로드 중...'
                : '사진 업로드'
          }
          disabled={isDisabled}
          onClick={() => {
            if (disabled) {
              toast.error('앨범 용량(5GB)이 가득 찼어요. 사진을 정리해주세요')
              return
            }
            inputRef.current?.click()
          }}
          style={{ opacity: isDisabled ? 0.5 : 1 }}
        >
          <PlusIcon size={26} color="#FFFFFF" className="fab__icon" />
        </button>
      </div>
    </>
  )
}
