'use server'

import { addDays } from 'date-fns'
import { createActionClient, createAdminClient } from '@/lib/supabase/server'

export type GenerateInviteLinkState =
  | { success: true; token: string }
  | { success: false; error: string }

/**
 * Generates (or refreshes) an invite link for an album.
 * Only the owner or co-host may generate links.
 * Any existing active invite is deactivated first.
 */
export async function generateInviteLink(albumId: string): Promise<GenerateInviteLinkState> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요' }

  const { client, user } = auth

  const { data: member } = await client
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
    return { success: false, error: '초대 링크를 생성할 권한이 없어요' }
  }

  // Deactivate any existing active invite
  await client
    .from('album_invites')
    .update({ is_active: false })
    .eq('album_id', albumId)
    .eq('is_active', true)

  const token = crypto.randomUUID()
  const expiresAt = addDays(new Date(), 7).toISOString()

  const { error } = await client.from('album_invites').insert({
    album_id: albumId,
    created_by: user.id,
    token,
    expires_at: expiresAt,
  })

  if (error) {
    console.error('[generateInviteLink] insert error:', error)
    return { success: false, error: '초대 링크 생성에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true, token }
}

export type JoinAlbumState =
  | { success: true; albumId: string }
  | { success: false; error: string; alreadyMember?: boolean }

/**
 * Joins an album using an invite token.
 * Validates token existence, active status, and expiry before inserting.
 */
export async function joinAlbum(token: string): Promise<JoinAlbumState> {
  const auth = await createActionClient()
  if (!auth) return { success: false, error: '로그인 세션이 만료되었어요' }

  const { client, user } = auth

  // Admin client for invite lookup — visitor is not yet a member, bypasses RLS
  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('album_invites')
    .select('id, album_id, expires_at, is_active')
    .eq('token', token)
    .maybeSingle()

  if (!invite || !invite.is_active) {
    return { success: false, error: '유효하지 않은 초대 링크예요' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: '만료된 초대 링크예요' }
  }

  // Already a member?
  const { data: existing } = await admin
    .from('album_members')
    .select('id')
    .eq('album_id', invite.album_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { success: true, albumId: invite.album_id }
  }

  const { error } = await client.from('album_members').insert({
    album_id: invite.album_id,
    user_id: user.id,
    role: 'member',
  })

  if (error) {
    console.error('[joinAlbum] insert error:', error)
    return { success: false, error: '앨범 참여에 실패했어요. 다시 시도해주세요' }
  }

  return { success: true, albumId: invite.album_id }
}
