import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { albumKeys } from '@/queries/keys'
import type { Database } from '@/types/database'

type MemberRole = Database['public']['Enums']['member_role']

export type AlbumDetail = {
  id: string
  title: string
  startDate: string
  endDate: string
  destinationName: string | null
  coverImageUrl: string | null
  storageLimitBytes: number
  storageUsedBytes: number
  ownerId: string
  deleteRequestedAt: string | null
}

export type AlbumMember = {
  userId: string
  role: MemberRole
  nickname: string
  avatarUrl: string | null
  joinedAt: string
}

export type AlbumListItem = {
  id: string
  title: string
  startDate: string
  endDate: string
  coverImageUrl: string | null
  destinationName: string | null
  createdAt: string
  myRole: MemberRole
  memberCount: number
  deleteRequestedAt: string | null
}

type RawRow = {
  role: MemberRole
  album: {
    id: string
    title: string
    start_date: string
    end_date: string
    cover_image_url: string | null
    destination_name: string | null
    created_at: string
    delete_requested_at: string | null
    members: [{ count: number }] | null
  }
}

function albumStatusRank(startDate: string, endDate: string): number {
  const today = new Date().toISOString().split('T')[0]
  if (today >= startDate && today <= endDate) return 0 // 진행 중
  if (today < startDate) return 1 // 예정
  return 2 // 종료
}

/**
 * Returns albums the current user belongs to, sorted by status (진행 중 > 예정 > 종료)
 * then by creation date descending within each group.
 */
export function useAlbums(): UseQueryResult<AlbumListItem[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: albumKeys.list(),
    queryFn: async (): Promise<AlbumListItem[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('album_members')
        .select(`
          role,
          album:albums!inner(
            id,
            title,
            start_date,
            end_date,
            cover_image_url,
            destination_name,
            created_at,
            delete_requested_at,
            members:album_members(count)
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const rows = (data ?? []) as unknown as RawRow[]

      return rows
        .map(({ role, album }) => ({
          id: album.id,
          title: album.title,
          startDate: album.start_date,
          endDate: album.end_date,
          coverImageUrl: album.cover_image_url,
          destinationName: album.destination_name,
          createdAt: album.created_at,
          myRole: role,
          memberCount: album.members?.[0]?.count ?? 0,
          deleteRequestedAt: album.delete_requested_at,
        }))
        .sort((a, b) => {
          const ra = albumStatusRank(a.startDate, a.endDate)
          const rb = albumStatusRank(b.startDate, b.endDate)
          if (ra !== rb) return ra - rb
          return b.createdAt.localeCompare(a.createdAt)
        })
    },
    staleTime: 60 * 1000,
  })
}

type RawDetailRow = {
  role: MemberRole
  album: {
    id: string
    title: string
    start_date: string
    end_date: string
    destination_name: string | null
    cover_image_url: string | null
    storage_limit_bytes: number
    storage_used_bytes: number
    owner_id: string
    delete_requested_at: string | null
  }
}

/**
 * Returns album detail and the current user's role for a specific album.
 * Returns null if the user is not a member of the album.
 */
export function useAlbumDetail(albumId: string): UseQueryResult<{ album: AlbumDetail; myRole: MemberRole } | null> {
  const supabase = createClient()

  return useQuery({
    queryKey: albumKeys.detail(albumId),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('album_members')
        .select(`
          role,
          album:albums!inner(
            id, title, start_date, end_date, destination_name,
            cover_image_url, storage_limit_bytes, storage_used_bytes, owner_id, delete_requested_at
          )
        `)
        .eq('album_id', albumId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      const row = data as unknown as RawDetailRow

      return {
        album: {
          id: row.album.id,
          title: row.album.title,
          startDate: row.album.start_date,
          endDate: row.album.end_date,
          destinationName: row.album.destination_name,
          coverImageUrl: row.album.cover_image_url,
          storageLimitBytes: row.album.storage_limit_bytes,
          storageUsedBytes: row.album.storage_used_bytes,
          ownerId: row.album.owner_id,
          deleteRequestedAt: row.album.delete_requested_at,
        },
        myRole: row.role,
      }
    },
    staleTime: 60 * 1000,
  })
}

type RawMemberWithUser = {
  user_id: string
  role: MemberRole
  joined_at: string
  user: {
    nickname: string
    avatar_url: string | null
  }
}

/**
 * Returns all members of an album with their user profile info.
 */
export function useAlbumMembers(albumId: string): UseQueryResult<AlbumMember[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: albumKeys.members(albumId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_members')
        .select(`
          user_id, role, joined_at,
          user:users!inner(nickname, avatar_url)
        `)
        .eq('album_id', albumId)
        .order('joined_at')

      if (error) throw error

      const rows = (data ?? []) as unknown as RawMemberWithUser[]

      return rows.map((row) => ({
        userId: row.user_id,
        role: row.role,
        nickname: row.user.nickname,
        avatarUrl: row.user.avatar_url,
        joinedAt: row.joined_at,
      }))
    },
    staleTime: 60 * 1000,
  })
}
