import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumProvider } from './AlbumContext'
import { AlbumChrome } from './AlbumChrome'
import type { AlbumDetail, AlbumMember } from '@/queries/albums'
import type { Database } from '@/types/database'

type MemberRole = Database['public']['Enums']['member_role']

type RawMemberRow = {
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

type RawMemberWithUser = {
  user_id: string
  role: MemberRole
  joined_at: string
  user: {
    nickname: string
    avatar_url: string | null
  }
}

interface AlbumLayoutProps {
  children: React.ReactNode
  params: Promise<{ albumId: string }>
}

export default async function AlbumLayout({
  children,
  params,
}: AlbumLayoutProps): Promise<React.JSX.Element> {
  const { albumId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [memberRes, membersRes] = await Promise.all([
    supabase
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
      .maybeSingle(),
    supabase
      .from('album_members')
      .select(`
        user_id, role, joined_at,
        user:users!inner(nickname, avatar_url)
      `)
      .eq('album_id', albumId)
      .order('joined_at'),
  ])

  if (memberRes.error || !memberRes.data) notFound()

  const memberRow = memberRes.data as unknown as RawMemberRow
  const membersRows = (membersRes.data ?? []) as unknown as RawMemberWithUser[]

  const album: AlbumDetail = {
    id: memberRow.album.id,
    title: memberRow.album.title,
    startDate: memberRow.album.start_date,
    endDate: memberRow.album.end_date,
    destinationName: memberRow.album.destination_name,
    coverImageUrl: memberRow.album.cover_image_url,
    storageLimitBytes: memberRow.album.storage_limit_bytes,
    storageUsedBytes: memberRow.album.storage_used_bytes,
    ownerId: memberRow.album.owner_id,
    deleteRequestedAt: memberRow.album.delete_requested_at,
  }

  const members: AlbumMember[] = membersRows.map((row) => ({
    userId: row.user_id,
    role: row.role,
    nickname: row.user.nickname,
    avatarUrl: row.user.avatar_url,
    joinedAt: row.joined_at,
  }))

  return (
    <AlbumProvider
      value={{
        album,
        members,
        myRole: memberRow.role,
        myUserId: user.id,
      }}
    >
      <AlbumChrome albumId={albumId}>{children}</AlbumChrome>
    </AlbumProvider>
  )
}
