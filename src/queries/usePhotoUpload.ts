'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { resizePhoto } from '@/lib/image/resize'
import { insertPhoto } from '@/actions/photo'
import { photoKeys } from '@/queries/keys'

const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

/** Minimal photo shape needed to render and delete an uploaded photo. */
export type UploadedPhoto = {
  id: string
  cdnUrl: string
}

export type PhotoUploadResult = {
  uploaded: UploadedPhoto[]
  failCount: number
}

/**
 * Provides a photo upload routine for a given album. Validates files, resizes
 * them, requests a presigned R2 URL, uploads, then persists the record for the
 * given date. Invalidates the album photo cache on success.
 */
export function usePhotoUpload(albumId: string): {
  upload: (files: File[], date: string, onDone?: (result: PhotoUploadResult) => void) => void
  isPending: boolean
} {
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  function upload(
    files: File[],
    date: string,
    onDone?: (result: PhotoUploadResult) => void,
  ): void {
    if (files.length === 0) return

    if (files.length > MAX_FILES) {
      toast.error(`한 번에 최대 ${MAX_FILES}장까지 업로드할 수 있어요`)
      return
    }

    const valid: File[] = []
    const skipped: string[] = []
    for (const file of files) {
      const typeOk = ACCEPTED_TYPES.has(file.type.toLowerCase())
      const sizeOk = file.size <= MAX_FILE_SIZE_BYTES
      if (typeOk && sizeOk) {
        valid.push(file)
      } else {
        skipped.push(file.name)
      }
    }

    if (skipped.length > 0) {
      toast.error(
        `${skipped.length}개 파일을 제외했어요 (지원 형식: JPEG·PNG·WEBP·HEIC, 최대 20 MB)`,
      )
    }
    if (valid.length === 0) return

    startTransition(async () => {
      const uploaded: UploadedPhoto[] = []
      let failCount = 0

      for (const file of valid) {
        try {
          const resized = await resizePhoto(file)

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
              break
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
            date,
            storageKey,
            cdnUrl: publicUrl,
            fileSizeBytes: resized.size,
          })

          if (!result.success) {
            toast.error(result.error)
            failCount++
          } else {
            uploaded.push({ id: result.photoId, cdnUrl: publicUrl })
          }
        } catch {
          failCount++
        }
      }

      if (uploaded.length > 0) {
        await queryClient.invalidateQueries({ queryKey: photoKeys.byAlbum(albumId) })
        toast.success(`${uploaded.length}장 업로드 완료`)
      }
      if (failCount > 0) {
        toast.error(`${failCount}장 업로드 실패`)
      }

      onDone?.({ uploaded, failCount })
    })
  }

  return { upload, isPending }
}
