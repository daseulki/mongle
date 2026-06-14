'use server'

import { revalidatePath } from 'next/cache'
import { createActionClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type MemberRole = Database['public']['Enums']['member_role']

export type MemberActionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Removes a member from an album. Owner only.
 * The kicked member's photos and diary entries remain in the album (data ownership stays).
 */
export async function kickMember(
  albumId: string,
  targetUserId: string,
): Promise<MemberActionResult> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요' }

  const { client, user } = auth

  if (targetUserId === user.id) {
    return { success: false, error: '자신을 강퇴할 수 없어요' }
  }

  const { data: myMember } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMember || myMember.role !== 'owner') {
    return { success: false, error: '강퇴 권한이 없어요' }
  }

  const { data: targetMember } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (!targetMember) {
    return { success: false, error: '해당 멤버를 찾을 수 없어요' }
  }

  if (targetMember.role === 'owner') {
    return { success: false, error: '방장은 강퇴할 수 없어요' }
  }

  const { error } = await client
    .from('album_members')
    .delete()
    .eq('album_id', albumId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('[kickMember] error:', error)
    return { success: false, error: '강퇴에 실패했어요. 다시 시도해주세요' }
  }

  revalidatePath(`/albums/${albumId}/members`)
  return { success: true }
}

/**
 * Updates a member's role. Owner only.
 * Can toggle between 'co_host' and 'member'. Cannot change owner's role.
 */
export async function updateMemberRole(
  albumId: string,
  targetUserId: string,
  newRole: Extract<MemberRole, 'co_host' | 'member'>,
): Promise<MemberActionResult> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요' }

  const { client, user } = auth

  if (targetUserId === user.id) {
    return { success: false, error: '자신의 역할은 변경할 수 없어요' }
  }

  const { data: myMember } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMember || myMember.role !== 'owner') {
    return { success: false, error: '역할 변경 권한이 없어요' }
  }

  const { data: targetMember } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (!targetMember) {
    return { success: false, error: '해당 멤버를 찾을 수 없어요' }
  }

  if (targetMember.role === 'owner') {
    return { success: false, error: '방장의 역할은 변경할 수 없어요' }
  }

  const { error } = await client
    .from('album_members')
    .update({ role: newRole })
    .eq('album_id', albumId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('[updateMemberRole] error:', error)
    return { success: false, error: '역할 변경에 실패했어요. 다시 시도해주세요' }
  }

  revalidatePath(`/albums/${albumId}/members`)
  return { success: true }
}
