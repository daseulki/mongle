'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CopyIcon, RefreshCwIcon, CheckIcon, UsersIcon, Settings2Icon } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { useAlbumContext } from '../AlbumContext'
import { useActiveInvite } from '@/queries/invite'
import { generateInviteLink } from '@/actions/invite'
import { kickMember, updateMemberRole } from '@/actions/member'
import { useQueryClient } from '@tanstack/react-query'
import { inviteKeys, albumKeys } from '@/queries/keys'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'
import type { AlbumMember } from '@/queries/albums'

type MemberRole = Database['public']['Enums']['member_role']

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: '방장',
  co_host: '코호스트',
  member: '멤버',
}

const ROLE_STYLE: Record<MemberRole, React.CSSProperties> = {
  owner: { background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)' },
  co_host: { background: 'var(--color-sky)', color: 'var(--color-ink)', opacity: 0.85 },
  member: { background: 'var(--color-bg-surface)', color: 'var(--color-ink-soft)' },
}

function RoleBadge({ role }: { role: MemberRole }): React.JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-4xl)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        ...ROLE_STYLE[role],
      }}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}

function Avatar({ nickname, avatarUrl }: { nickname: string; avatarUrl: string | null }): React.JSX.Element {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={nickname}
        width={40}
        height={40}
        style={{ borderRadius: 'var(--radius-4xl)', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      aria-hidden
      style={{
        width: 40, height: 40,
        borderRadius: 'var(--radius-4xl)',
        background: 'var(--color-bg-surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: 'var(--text-base)', fontWeight: 700,
        color: 'var(--color-ink-soft)',
      }}
    >
      {nickname.charAt(0)}
    </div>
  )
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
  destructive,
}: {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
  destructive?: boolean
}): React.JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: 'var(--space-6) var(--page-padding) var(--space-8)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h2 id="confirm-modal-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
            {title}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)', lineHeight: 1.6 }}>
            {description}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? '처리 중...' : confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={isPending} style={{ width: '100%' }}>
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MembersClient(): React.JSX.Element {
  const { album, members, myRole, myUserId } = useAlbumContext()
  const queryClient = useQueryClient()
  const canManageInvite = myRole === 'owner' || myRole === 'co_host'
  const isOwner = myRole === 'owner'

  const { data: activeInvite, isLoading: inviteLoading } = useActiveInvite(
    canManageInvite ? album.id : '',
  )

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showNewLinkConfirm, setShowNewLinkConfirm] = useState(false)

  // Member action state
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)
  const [kickTarget, setKickTarget] = useState<AlbumMember | null>(null)

  const inviteUrl = activeInvite
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${activeInvite.token}`
    : null

  const inviteDDay = activeInvite
    ? differenceInCalendarDays(parseISO(activeInvite.expiresAt), new Date())
    : null

  const inviteDDayLabel =
    inviteDDay === null
      ? null
      : inviteDDay <= 0
        ? '만료됨'
        : `D-${inviteDDay}`

  async function doGenerate() {
    setIsGenerating(true)
    setGenerateError(null)
    const result = await generateInviteLink(album.id)
    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: inviteKeys.active(album.id) })
    } else {
      setGenerateError(result.error)
    }
    setIsGenerating(false)
  }

  function handleGenerate() {
    if (activeInvite) {
      setShowNewLinkConfirm(true)
    } else {
      void doGenerate()
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(inviteUrl)
    } else {
      const el = document.createElement('textarea')
      el.value = inviteUrl
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleKickConfirm() {
    if (!kickTarget) return
    setPendingMemberId(kickTarget.userId)
    const result = await kickMember(album.id, kickTarget.userId)
    setPendingMemberId(null)
    setKickTarget(null)
    if (result.success) {
      toast.success(`${kickTarget.nickname}님을 강퇴했어요`)
      await queryClient.invalidateQueries({ queryKey: albumKeys.members(album.id) })
    } else {
      toast.error(result.error)
    }
  }

  async function handleRoleToggle(member: AlbumMember) {
    const newRole: Extract<MemberRole, 'co_host' | 'member'> =
      member.role === 'co_host' ? 'member' : 'co_host'
    setPendingMemberId(member.userId)
    const result = await updateMemberRole(album.id, member.userId, newRole)
    setPendingMemberId(null)
    if (result.success) {
      const label = newRole === 'co_host' ? '코호스트로 지정됐어요' : '일반 멤버로 변경됐어요'
      toast.success(`${member.nickname}님이 ${label}`)
      await queryClient.invalidateQueries({ queryKey: albumKeys.members(album.id) })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <main style={{ padding: '0 var(--page-padding) var(--space-10)' }}>
      {/* 멤버 목록 */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-5) 0 var(--space-3)',
          }}
        >
          <UsersIcon size={16} style={{ color: 'var(--color-ink-muted)' }} />
          <h2
            style={{
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--color-ink-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >
            멤버 {members.length}명
          </h2>
        </div>

        <ul
          style={{
            display: 'flex', flexDirection: 'column', gap: 0,
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}
        >
          {members.map((member, i) => {
            const isSelf = member.userId === myUserId
            const isPendingThis = pendingMemberId === member.userId
            const canActOn = isOwner && !isSelf && member.role !== 'owner'

            return (
              <li
                key={member.userId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
                  opacity: isPendingThis ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <Avatar nickname={member.nickname} avatarUrl={member.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-base)', fontWeight: 500,
                      color: 'var(--color-ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {member.nickname}
                  </p>
                </div>
                <RoleBadge role={member.role} />

                {/* 방장 전용 액션 버튼 */}
                {canActOn && !isPendingThis && (
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                    {/* Co-host 토글 — 방장만 */}
                    {myRole === 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleRoleToggle(member)}
                        style={{
                          fontSize: 'var(--text-xs)', fontWeight: 500,
                          color: 'var(--color-ink-soft)',
                          background: 'var(--color-bg-surface)',
                          border: 'none', borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px', cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.role === 'co_host' ? '코호스트 해제' : '코호스트 지정'}
                      </button>
                    )}
                    {/* 강퇴 — 방장만 */}
                    <button
                      type="button"
                      onClick={() => setKickTarget(member)}
                      style={{
                        fontSize: 'var(--text-xs)', fontWeight: 500,
                        color: 'var(--color-terracotta)',
                        background: 'none', border: 'none',
                        padding: '4px 6px', cursor: 'pointer',
                      }}
                    >
                      강퇴
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* 초대 링크 섹션 — owner/co_host 전용 */}
      {canManageInvite && (
        <section>
          <h2
            style={{
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--color-ink-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: 'var(--space-3)',
            }}
          >
            초대 링크
          </h2>

          <div
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
            }}
          >
            {inviteLoading ? (
              <div
                style={{
                  height: 44, background: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                }}
              />
            ) : inviteUrl && inviteDDay !== null && inviteDDay > 0 ? (
              <>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    background: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0 var(--space-3)', height: 44,
                  }}
                >
                  <span
                    style={{
                      flex: 1, fontSize: 'var(--text-sm)',
                      color: 'var(--color-ink-soft)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {inviteUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="초대 링크 복사"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copied ? 'var(--color-sage)' : 'var(--color-amber)',
                      flexShrink: 0,
                    }}
                  >
                    {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    variant="secondary" size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{ flex: 1 }}
                  >
                    <RefreshCwIcon size={14} />
                    링크 재생성
                  </Button>
                  <Button size="sm" onClick={handleCopy} style={{ flex: 1 }}>
                    <CopyIcon size={14} />
                    {copied ? '복사됨' : '복사'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)' }}>
                  {inviteDDay !== null && inviteDDay <= 0
                    ? '초대 링크가 만료됐어요. 새 링크를 생성해주세요.'
                    : '초대 링크를 생성해서 멤버를 초대해보세요'}
                </p>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? '생성 중...' : '초대 링크 생성'}
                </Button>
              </>
            )}

            {generateError && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-terracotta)', textAlign: 'center' }}>
                {generateError}
              </p>
            )}

            {inviteDDayLabel && inviteDDay !== null && inviteDDay > 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-disabled)' }}>
                유효기간: {inviteDDayLabel} 남음
              </p>
            )}
          </div>
        </section>
      )}

      {/* 앨범 설정 — owner 전용 */}
      {myRole === 'owner' && (
        <section style={{ marginTop: 'var(--space-6)' }}>
          <Link
            href={`/albums/${album.id}/settings`}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              textDecoration: 'none',
              color: 'var(--color-ink-soft)',
            }}
          >
            <Settings2Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>앨범 설정</span>
          </Link>
        </section>
      )}

      {/* 강퇴 확인 모달 */}
      {kickTarget && (
        <ConfirmModal
          title={`${kickTarget.nickname}님을 강퇴할까요?`}
          description="강퇴된 멤버는 앨범에 접근할 수 없게 됩니다. 해당 멤버의 사진과 일기는 앨범에 남아있어요."
          confirmLabel="강퇴"
          destructive
          isPending={pendingMemberId === kickTarget.userId}
          onConfirm={handleKickConfirm}
          onCancel={() => setKickTarget(null)}
        />
      )}

      {/* 새 링크 발급 확인 모달 */}
      {showNewLinkConfirm && (
        <ConfirmModal
          title="새 초대 링크를 발급할까요?"
          description="기존 초대 링크는 즉시 사용할 수 없게 됩니다."
          confirmLabel="새 링크 발급"
          isPending={isGenerating}
          onConfirm={async () => {
            setShowNewLinkConfirm(false)
            await doGenerate()
          }}
          onCancel={() => setShowNewLinkConfirm(false)}
        />
      )}
    </main>
  )
}
