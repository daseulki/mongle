'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActionClient } from '@/lib/supabase/server'

const itemSchema = z
  .object({
    albumId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
    placeName: z
      .string()
      .trim()
      .min(1, '장소명을 입력해주세요')
      .max(50, '50자 이하로 입력해주세요'),
    scheduledTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, '올바른 시간 형식이 아닙니다 (HH:MM)')
      .optional()
      .or(z.literal('')),
    timePeriod: z
      .enum(['morning', 'noon', 'afternoon', 'evening', 'night'])
      .optional()
      .or(z.literal('')),
    memo: z.string().max(200, '200자 이하로 입력해주세요').optional(),
  })
  .refine((d) => !(d.scheduledTime && d.timePeriod), {
    message: '시간대와 정확한 시각은 함께 설정할 수 없어요',
    path: ['timePeriod'],
  })

const reorderSchema = z.object({
  albumId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  orderedIds: z.array(z.string().uuid()).min(1),
})

export type ItineraryActionResult =
  | { success: true }
  | { success: false; error: string }

export async function createItineraryItem(
  _: ItineraryActionResult | null,
  formData: FormData,
): Promise<ItineraryActionResult> {
  const raw = {
    albumId: formData.get('albumId'),
    date: formData.get('date'),
    placeName: formData.get('placeName'),
    scheduledTime: formData.get('scheduledTime') || '',
    timePeriod: formData.get('timePeriod') || '',
    memo: formData.get('memo') || '',
  }

  const parsed = itemSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth
  const { albumId, date, placeName, scheduledTime, timePeriod, memo } = parsed.data

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
    return { success: false, error: '일정 추가 권한이 없습니다' }
  }

  const { data: existing } = await client
    .from('itinerary_items')
    .select('order_index')
    .eq('album_id', albumId)
    .eq('date', date)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrderIndex = (existing?.order_index ?? -1) + 1

  const { error } = await client.from('itinerary_items').insert({
    album_id: albumId,
    date,
    place_name: placeName,
    scheduled_time: scheduledTime || null,
    time_period: timePeriod || null,
    memo: memo || null,
    order_index: nextOrderIndex,
    created_by: user.id,
  })

  if (error) return { success: false, error: '일정 저장에 실패했어요' }

  revalidatePath(`/albums/${albumId}`)
  return { success: true }
}

export async function updateItineraryItem(
  _: ItineraryActionResult | null,
  formData: FormData,
): Promise<ItineraryActionResult> {
  const itemId = formData.get('itemId') as string | null
  if (!itemId) return { success: false, error: '항목을 찾을 수 없습니다' }

  const raw = {
    albumId: formData.get('albumId'),
    date: formData.get('date'),
    placeName: formData.get('placeName'),
    scheduledTime: formData.get('scheduledTime') || '',
    timePeriod: formData.get('timePeriod') || '',
    memo: formData.get('memo') || '',
  }

  const parsed = itemSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth
  const { albumId, date, placeName, scheduledTime, timePeriod, memo } = parsed.data

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
    return { success: false, error: '일정 수정 권한이 없습니다' }
  }

  const { error } = await client
    .from('itinerary_items')
    .update({
      date,
      place_name: placeName,
      scheduled_time: scheduledTime || null,
      time_period: timePeriod || null,
      memo: memo || null,
    })
    .eq('id', itemId)
    .eq('album_id', albumId)

  if (error) return { success: false, error: '일정 수정에 실패했어요' }

  revalidatePath(`/albums/${albumId}`)
  return { success: true }
}

export async function deleteItineraryItem(
  albumId: string,
  itemId: string,
): Promise<ItineraryActionResult> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
    return { success: false, error: '일정 삭제 권한이 없습니다' }
  }

  const { error } = await client
    .from('itinerary_items')
    .delete()
    .eq('id', itemId)
    .eq('album_id', albumId)

  if (error) return { success: false, error: '일정 삭제에 실패했어요' }

  revalidatePath(`/albums/${albumId}`)
  return { success: true }
}

/**
 * 같은 날짜 내 일정 순서를 재배치한다.
 * orderedIds 순서대로 order_index 를 0..n 으로 갱신.
 * @param albumId 앨범 ID
 * @param date 대상 날짜 (YYYY-MM-DD)
 * @param orderedIds 새 순서대로 정렬된 일정 ID 배열
 */
export async function reorderItineraryItems(
  albumId: string,
  date: string,
  orderedIds: string[],
): Promise<ItineraryActionResult> {
  const parsed = reorderSchema.safeParse({ albumId, date, orderedIds })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
    return { success: false, error: '일정 순서 변경 권한이 없습니다' }
  }

  const results = await Promise.all(
    parsed.data.orderedIds.map((id, index) =>
      client
        .from('itinerary_items')
        .update({ order_index: index })
        .eq('id', id)
        .eq('album_id', albumId)
        .eq('date', date),
    ),
  )

  if (results.some((r) => r.error)) {
    return { success: false, error: '순서 변경에 실패했어요' }
  }

  revalidatePath(`/albums/${albumId}`)
  return { success: true }
}
