import { notFound, redirect } from 'next/navigation'
import { format, parseISO, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { DiaryEditForm } from './DiaryEditForm'
import type { DiaryEntry } from '@/queries/diary'

interface Props {
  params: Promise<{ albumId: string; date: string }>
}

export default async function DiaryEditPage({ params }: Props): Promise<React.JSX.Element> {
  const { albumId, date } = await params

  const parsedDate = parseISO(date)
  if (!isValid(parsedDate)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('album_members')
    .select('role')
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) notFound()

  const { data: raw } = await supabase
    .from('diary_entries')
    .select(
      'id, album_id, user_id, date, content, created_at, updated_at, author:users!inner(nickname, avatar_url)',
    )
    .eq('album_id', albumId)
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle()

  let existingEntry: DiaryEntry | undefined
  if (raw) {
    const author = raw.author as { nickname: string; avatar_url: string | null }
    existingEntry = {
      id: raw.id,
      albumId: raw.album_id,
      userId: raw.user_id,
      date: raw.date,
      content: raw.content,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      author: { nickname: author.nickname, avatarUrl: author.avatar_url },
    }
  }

  const displayDate = format(parsedDate, 'M월 d일 (E)', { locale: ko })

  return (
    <AppLayout>
      <PageHeader
        title={`${displayDate} 일기`}
        backHref={`/albums/${albumId}/memories`}
        showBack
      />
      <div style={{ padding: 'var(--space-5) var(--page-padding)' }}>
        <DiaryEditForm albumId={albumId} date={date} existingEntry={existingEntry} />
      </div>
    </AppLayout>
  )
}
