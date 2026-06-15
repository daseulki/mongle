import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export default async function OnboardingProfilePage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const defaultNickname =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? ''

  const googleAvatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null

  return <ProfileForm defaultNickname={defaultNickname} googleAvatarUrl={googleAvatarUrl} />
}
