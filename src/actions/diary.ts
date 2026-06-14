'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createActionClient } from '@/lib/supabase/server'

const diarySchema = z.object({
  albumId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요')
    .max(1000, '1,000자 이하로 입력해주세요'),
})

export type DiaryActionResult =
  | { success: true }
  | { success: false; error: string }

export async function saveDiary(
  _: DiaryActionResult | null,
  formData: FormData,
): Promise<DiaryActionResult> {
  const raw = {
    albumId: formData.get('albumId'),
    date: formData.get('date'),
    content: formData.get('content'),
  }

  const parsed = diarySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth
  const { albumId, date, content } = parsed.data

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { success: false, error: '앨범 멤버만 일기를 쓸 수 있습니다' }

  const { error } = await client.from('diary_entries').upsert(
    {
      album_id: albumId,
      user_id: user.id,
      date,
      content,
    },
    { onConflict: 'album_id,user_id,date' },
  )

  if (error) return { success: false, error: '일기 저장에 실패했어요' }

  revalidatePath(`/albums/${albumId}/memories`)
  return { success: true }
}

export async function deleteDiary(albumId: string, date: string): Promise<DiaryActionResult> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인이 필요합니다' }

  const { client, user } = auth

  const { error } = await client
    .from('diary_entries')
    .delete()
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .eq('date', date)

  if (error) return { success: false, error: '일기 삭제에 실패했어요' }

  revalidatePath(`/albums/${albumId}/memories`)
  return { success: true }
}
