import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileSettingsForm } from './ProfileSettingsForm'

export const metadata = { title: '프로필 설정' }

export default async function ProfileSettingsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding/profile')

  return (
    <AppLayout>
      <PageHeader title="프로필 설정" backHref="/" showBack />
      <ProfileSettingsForm
        nickname={profile.nickname}
        email={user.email ?? ''}
        avatarUrl={profile.avatar_url}
      />
    </AppLayout>
  )
}
