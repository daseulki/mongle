import { redirect } from 'next/navigation'
import { MapPinIcon, CalendarIcon, UsersIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { JoinButton } from './JoinButton'
import Link from 'next/link'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export const metadata = { title: '앨범 초대' }

export default async function InvitePage({ params }: InvitePageProps): Promise<React.JSX.Element> {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  // Admin client bypasses RLS — necessary because the visitor is not yet a member.
  const admin = createAdminClient()

  // Step 1: validate the invite token
  const { data: invite, error: inviteError } = await admin
    .from('album_invites')
    .select('id, album_id, expires_at, is_active')
    .eq('token', token)
    .maybeSingle()

  if (inviteError) {
    console.error('[InvitePage] invite query error:', inviteError)
  }

  const isInvalid = !invite || !invite.is_active
  const isExpired = !!invite && new Date(invite.expires_at) < new Date()

  // Step 2: check membership (only when invite is valid)
  if (!isInvalid && !isExpired) {
    const { data: membership } = await admin
      .from('album_members')
      .select('id')
      .eq('album_id', invite.album_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membership) {
      redirect(`/albums/${invite.album_id}`)
    }
  }

  if (isInvalid || isExpired) {
    return (
      <AppLayout>
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '60vh',
            padding: '0 var(--page-padding)',
            gap: 'var(--space-5)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🔗
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
              {isExpired ? '만료된 초대 링크예요' : '유효하지 않은 초대 링크예요'}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
              앨범 방장에게 새 초대 링크를 요청해주세요
            </p>
          </div>
          <Link
            href="/"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-amber)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            홈으로 돌아가기
          </Link>
        </main>
      </AppLayout>
    )
  }

  // Step 3: fetch album details for display (including deletion status)
  const { data: album } = await admin
    .from('albums')
    .select('id, title, destination_name, start_date, end_date, delete_requested_at')
    .eq('id', invite.album_id)
    .single()

  const { count: memberCount } = await admin
    .from('album_members')
    .select('*', { count: 'exact', head: true })
    .eq('album_id', invite.album_id)

  if (!album) {
    redirect('/')
  }

  // Block joining albums that are scheduled for deletion
  if (album.delete_requested_at) {
    return (
      <AppLayout>
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '60vh',
            padding: '0 var(--page-padding)',
            gap: 'var(--space-5)',
          }}
        >
          <div
            style={{
              width: 72, height: 72,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🗑️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
              이 앨범은 곧 삭제될 예정이에요
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
              삭제 예정인 앨범에는 참여할 수 없어요
            </p>
          </div>
          <Link
            href="/"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-amber)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            홈으로 돌아가기
          </Link>
        </main>
      </AppLayout>
    )
  }

  const dateRange = `${format(parseISO(album.start_date), 'M월 d일', { locale: ko })} - ${format(parseISO(album.end_date), 'M월 d일', { locale: ko })}`

  return (
    <AppLayout>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--space-10) var(--page-padding)',
          gap: 'var(--space-8)',
          minHeight: '80vh',
          justifyContent: 'center',
        }}
      >
        {/* 앨범 카드 */}
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>앨범 초대</p>
            <h1
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--color-ink)',
                wordBreak: 'keep-all',
              }}
            >
              {album.title}
            </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {album.destination_name && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: 'var(--color-ink-soft)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <MapPinIcon size={16} style={{ flexShrink: 0 }} />
                <span>{album.destination_name}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-ink-soft)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <CalendarIcon size={16} style={{ flexShrink: 0 }} />
              <span>{dateRange}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-ink-soft)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <UsersIcon size={16} style={{ flexShrink: 0 }} />
              <span>멤버 {memberCount ?? 0}명</span>
            </div>
          </div>
        </div>

        {/* 참여 버튼 */}
        <div style={{ width: '100%', maxWidth: 360 }}>
          <JoinButton token={token} />
        </div>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-disabled)', textAlign: 'center' }}>
          링크 유효기간: {format(parseISO(invite.expires_at), 'M월 d일 HH:mm', { locale: ko })}까지
        </p>
      </main>
    </AppLayout>
  )
}
