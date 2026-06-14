import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { ItineraryForm } from '@/components/itinerary/ItineraryForm'
import type { ItineraryItem } from '@/queries/itinerary'

interface EditItineraryPageProps {
  params: Promise<{ albumId: string; itemId: string }>
}

export const metadata = { title: '일정 수정' }

export default async function EditItineraryPage({
  params,
}: EditItineraryPageProps): Promise<React.JSX.Element> {
  const { albumId, itemId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || (member.role !== 'owner' && member.role !== 'co_host')) {
    redirect(`/albums/${albumId}`)
  }

  const { data: row } = await supabase
    .from('itinerary_items')
    .select('id, album_id, date, place_name, scheduled_time, memo, order_index, created_by, created_at')
    .eq('id', itemId)
    .eq('album_id', albumId)
    .maybeSingle()

  if (!row) notFound()

  const item: ItineraryItem = {
    id: row.id,
    albumId: row.album_id,
    date: row.date,
    placeName: row.place_name,
    scheduledTime: row.scheduled_time,
    memo: row.memo,
    orderIndex: row.order_index,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }

  return (
    <AppLayout>
      <PageHeader
        title="일정 수정"
        backHref={`/albums/${albumId}`}
        showBack
      />
      <main
        className="page-content"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <ItineraryForm albumId={albumId} date={item.date} item={item} />
      </main>
    </AppLayout>
  )
}
