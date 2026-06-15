'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const nicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상이어야 해요')
    .max(20, '닉네임은 20자 이하여야 해요'),
})

export type ProfileFormState = {
  error: string
} | null

export async function createUserProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const raw = formData.get('nickname')
  const result = nicknameSchema.safeParse({ nickname: raw })

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? '입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[createUserProfile] auth error:', authError)
    return { error: '로그인 세션이 만료되었어요. 다시 로그인해주세요' }
  }

  // Prefer user-uploaded avatar (from form), then Google OAuth avatar
  const uploadedAvatar = formData.get('avatarUrl')
  const avatarUrl =
    (typeof uploadedAvatar === 'string' && uploadedAvatar.startsWith('http') ? uploadedAvatar : null) ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      nickname: result.data.nickname,
      avatar_url: avatarUrl,
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.error('[createUserProfile] db error:', error)
    return { error: '저장에 실패했어요. 다시 시도해주세요' }
  }

  redirect('/')
}

// ─── Update Profile ────────────────────────────────────────────

const updateNicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상이어야 해요')
    .max(20, '닉네임은 20자 이하여야 해요'),
})

export type UpdateProfileState =
  | { success: true }
  | { success: false; error: string }
  | null

/**
 * Updates the current user's nickname and optionally their avatar URL.
 */
export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const raw = formData.get('nickname')
  const result = updateNicknameSchema.safeParse({ nickname: raw })

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? '입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '로그인 세션이 만료되었어요. 다시 로그인해주세요' }
  }

  const uploadedAvatar = formData.get('avatarUrl')
  const avatarUrl =
    typeof uploadedAvatar === 'string' && uploadedAvatar.startsWith('http')
      ? uploadedAvatar
      : undefined

  const { error } = await supabase
    .from('users')
    .update({
      nickname: result.data.nickname,
      ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfile] db error:', error)
    return { success: false, error: '저장에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true }
}
