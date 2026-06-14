import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlbumSettingsForm } from './AlbumSettingsForm'
import type { AlbumDetail } from '@/queries/albums'

interface AlbumSettingsPageProps {
  params: Promise<{ albumId: string }>
}

export const metadata = { title: '앨범 설정' }

export default async function AlbumSettingsPage({
  params,
}: AlbumSettingsPageProps): Promise<React.JSX.Element> {
  const { albumId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
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

  if (!member || member.role !== 'owner') {
    redirect(`/albums/${albumId}`)
  }

  type RawAlbum = {
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

  const raw = member.album as unknown as RawAlbum

  const album: AlbumDetail = {
    id: raw.id,
    title: raw.title,
    startDate: raw.start_date,
    endDate: raw.end_date,
    destinationName: raw.destination_name,
    coverImageUrl: raw.cover_image_url,
    storageLimitBytes: raw.storage_limit_bytes,
    storageUsedBytes: raw.storage_used_bytes,
    ownerId: raw.owner_id,
    deleteRequestedAt: raw.delete_requested_at,
  }

  return (
    <AppLayout>
      <PageHeader
        title="앨범 설정"
        backHref={`/albums/${albumId}/members`}
        showBack
      />
      <AlbumSettingsForm album={album} />
    </AppLayout>
  )
}
