'use server'

import { z } from 'zod'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { createActionClient } from '@/lib/supabase/server'

export type CreateAlbumInput = {
  title: string
  startDate: string
  endDate: string
  destinationName?: string
  coverImageUrl?: string
}

const createAlbumSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '여행 이름을 입력해주세요')
      .max(30, '30자 이하로 입력해주세요'),
    startDate: z
      .string()
      .min(1, '시작일을 선택해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜를 선택해주세요'),
    endDate: z
      .string()
      .min(1, '종료일을 선택해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜를 선택해주세요'),
    destinationName: z.string().trim().max(50, '50자 이하로 입력해주세요').optional(),
    coverImageUrl: z.string().url().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: '종료일이 시작일보다 빨라요',
    path: ['endDate'],
  })
  .refine(
    (data) => differenceInCalendarDays(parseISO(data.endDate), parseISO(data.startDate)) <= 30,
    {
      message: '여행 기간은 최대 30일이에요',
      path: ['endDate'],
    },
  )

export type CreateAlbumState =
  | { success: true; albumId: string }
  | { success: false; error: string }
  | null

/**
 * Creates a new album and registers the creator as the owner.
 * Returns the new album ID on success.
 */
export async function createAlbum(input: unknown): Promise<CreateAlbumState> {
  const result = createAlbumSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? '입력값을 확인해주세요' }
  }

  const auth = await createActionClient()
  if (!auth) {
    return { success: false, error: '로그인 세션이 만료되었어요. 다시 로그인해주세요' }
  }

  const { client, user } = auth
  const { title, startDate, endDate, destinationName, coverImageUrl } = result.data

  // UUID를 미리 생성해 .select() 체이닝을 제거:
  // INSERT ... RETURNING은 albums_select_member(fn_is_album_member) 정책도 요구하는데,
  // album_members INSERT 이전에는 아직 멤버가 없어 42501이 발생한다.
  const albumId = crypto.randomUUID()

  const { error: albumError } = await client
    .from('albums')
    .insert({
      id: albumId,
      owner_id: user.id,
      title,
      start_date: startDate,
      end_date: endDate,
      destination_name: destinationName || null,
      cover_image_url: coverImageUrl ?? null,
    })

  if (albumError) {
    console.error('[createAlbum] insert error:', albumError)
    return { success: false, error: '앨범 생성에 실패했어요. 다시 시도해주세요' }
  }

  const { error: memberError } = await client.from('album_members').insert({
    album_id: albumId,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    console.error('[createAlbum] member insert error:', memberError)
    return { success: false, error: '앨범 생성에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true, albumId }
}

// ─── Update Album ───────────────────────────────────────────────

export type UpdateAlbumInput = {
  title: string
  startDate: string
  endDate: string
  destinationName?: string
  coverImageUrl?: string | null
}

const updateAlbumSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, '여행 이름을 입력해주세요')
      .max(30, '30자 이하로 입력해주세요'),
    startDate: z
      .string()
      .min(1, '시작일을 선택해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜를 선택해주세요'),
    endDate: z
      .string()
      .min(1, '종료일을 선택해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜를 선택해주세요'),
    destinationName: z.string().trim().max(50, '50자 이하로 입력해주세요').optional(),
    coverImageUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: '종료일이 시작일보다 빨라요',
    path: ['endDate'],
  })
  .refine(
    (data) => differenceInCalendarDays(parseISO(data.endDate), parseISO(data.startDate)) <= 30,
    {
      message: '여행 기간은 최대 30일이에요',
      path: ['endDate'],
    },
  )

export type UpdateAlbumState =
  | { success: true }
  | { success: false; error: string }
  | null

/**
 * Updates album title, date range, and destination. Owner only.
 */
export async function updateAlbum(albumId: string, input: unknown): Promise<UpdateAlbumState> {
  const result = updateAlbumSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? '입력값을 확인해주세요' }
  }

  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요. 다시 로그인해주세요' }

  const { client, user } = auth

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'owner') {
    return { success: false, error: '앨범 설정을 변경할 권한이 없어요' }
  }

  const { title, startDate, endDate, destinationName, coverImageUrl } = result.data

  const { error } = await client
    .from('albums')
    .update({
      title,
      start_date: startDate,
      end_date: endDate,
      destination_name: destinationName || null,
      destination_lat: null,
      destination_lng: null,
      ...(coverImageUrl !== undefined ? { cover_image_url: coverImageUrl } : {}),
    })
    .eq('id', albumId)

  if (error) {
    console.error('[updateAlbum] error:', error)
    return { success: false, error: '저장에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true }
}

// ─── Request Album Deletion ──────────────────────────────────────

export type RequestAlbumDeletionState =
  | { success: true }
  | { success: false; error: string }
  | null

/**
 * Marks an album for deletion (7-day grace period). Owner only.
 * The actual deletion is handled by a scheduled Edge Function.
 */
export async function requestAlbumDeletion(albumId: string): Promise<RequestAlbumDeletionState> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요. 다시 로그인해주세요' }

  const { client, user } = auth

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'owner') {
    return { success: false, error: '앨범 삭제 요청 권한이 없어요' }
  }

  const { error } = await client
    .from('albums')
    .update({ delete_requested_at: new Date().toISOString() })
    .eq('id', albumId)

  if (error) {
    console.error('[requestAlbumDeletion] error:', error)
    return { success: false, error: '삭제 요청에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true }
}

// ─── Cancel Album Deletion ───────────────────────────────────────

export type CancelAlbumDeletionState =
  | { success: true }
  | { success: false; error: string }
  | null

/**
 * Cancels a pending album deletion. Owner only.
 */
export async function cancelAlbumDeletion(albumId: string): Promise<CancelAlbumDeletionState> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요. 다시 로그인해주세요' }

  const { client, user } = auth

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'owner') {
    return { success: false, error: '앨범 삭제 취소 권한이 없어요' }
  }

  const { error } = await client
    .from('albums')
    .update({ delete_requested_at: null })
    .eq('id', albumId)

  if (error) {
    console.error('[cancelAlbumDeletion] error:', error)
    return { success: false, error: '삭제 취소에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true }
}
