import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { ItineraryForm } from '@/components/itinerary/ItineraryForm'

interface NewItineraryPageProps {
  params: Promise<{ albumId: string }>
  searchParams: Promise<{ date?: string }>
}

export const metadata = { title: '일정 추가' }

export default async function NewItineraryPage({
  params,
  searchParams,
}: NewItineraryPageProps): Promise<React.JSX.Element> {
  const { albumId } = await params
  const { date } = await searchParams
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

  const { data: album } = await supabase
    .from('albums')
    .select('start_date')
    .eq('id', albumId)
    .maybeSingle()

  const targetDate = date ?? album?.start_date ?? ''

  return (
    <AppLayout>
      <PageHeader
        title="일정 추가"
        backHref={`/albums/${albumId}`}
        showBack
      />
      <main
        className="page-content"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <ItineraryForm albumId={albumId} date={targetDate} />
      </main>
    </AppLayout>
  )
}
