'use server'

import { z } from 'zod'
import { createActionClient } from '@/lib/supabase/server'

const insertPhotoSchema = z.object({
  albumId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  storageKey: z.string().min(1),
  cdnUrl: z.string().url(),
  fileSizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export type PhotoActionResult =
  | { success: true; photoId: string }
  | { success: false; error: string }

export type DeletePhotoResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Inserts a photo record after the client has uploaded the file to R2.
 * @param input - Photo metadata from the upload flow
 */
export async function insertPhoto(
  input: z.input<typeof insertPhotoSchema>,
): Promise<PhotoActionResult> {
  const parsed = insertPhotoSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth
  const { albumId, date, storageKey, cdnUrl, fileSizeBytes, width, height } = parsed.data

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { success: false, error: '앨범 멤버만 사진을 업로드할 수 있습니다' }

  const { data, error } = await client
    .from('photos')
    .insert({
      album_id: albumId,
      uploaded_by: user.id,
      date,
      storage_key: storageKey,
      cdn_url: cdnUrl,
      file_size_bytes: fileSizeBytes,
      width: width ?? null,
      height: height ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { success: false, error: '사진 저장에 실패했어요' }

  return { success: true, photoId: data.id }
}

/**
 * Deletes a photo record. Only the uploader can delete their own photo.
 */
export async function deletePhoto(
  albumId: string,
  photoId: string,
): Promise<DeletePhotoResult> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth

  const { data: photo } = await client
    .from('photos')
    .select('uploaded_by')
    .eq('id', photoId)
    .eq('album_id', albumId)
    .maybeSingle()

  if (!photo) return { success: false, error: '사진을 찾을 수 없습니다' }
  if (photo.uploaded_by !== user.id) return { success: false, error: '자신의 사진만 삭제할 수 있습니다' }

  const { error } = await client
    .from('photos')
    .delete()
    .eq('id', photoId)
    .eq('album_id', albumId)

  if (error) return { success: false, error: '사진 삭제에 실패했어요' }

  return { success: true }
}
