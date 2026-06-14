import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { MembersClient } from './MembersClient'

interface MembersPageProps {
  params: Promise<{ albumId: string }>
}

export const metadata = { title: '멤버' }

export default async function MembersPage({ params }: MembersPageProps): Promise<React.JSX.Element> {
  const { albumId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <AppLayout>
      <PageHeader
        title="멤버"
        backHref={`/albums/${albumId}`}
        showBack
      />
      <MembersClient />
    </AppLayout>
  )
}
