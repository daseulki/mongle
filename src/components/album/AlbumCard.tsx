'use client'

import Link from 'next/link'
import Image from 'next/image'
import { differenceInCalendarDays, parseISO, isAfter, startOfDay } from 'date-fns'
import type { Database } from '@/types/database'
import type { AlbumListItem } from '@/queries/albums'

type MemberRole = Database['public']['Enums']['member_role']

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: '방장',
  co_host: '코호스트',
  member: '멤버',
}

const ROLE_CLASS: Record<MemberRole, string> = {
  owner: 'role-badge--owner',
  co_host: 'role-badge--cohost',
  member: 'role-badge--member',
}

/**
 * Returns a D-Day string relative to today.
 * "D-7" → 7 days until start
 * "D-Day" → trip starts today
 * "여행 중" → currently on the trip
 * "완료" → trip has ended
 */
function getDDayLabel(startDate: string, endDate: string): string {
  const today = startOfDay(new Date())
  const start = parseISO(startDate)
  const end = parseISO(endDate)

  if (isAfter(start, today)) {
    const days = differenceInCalendarDays(start, today)
    return `D-${days}`
  }

  if (!isAfter(today, end)) {
    return today.getTime() === start.getTime() ? 'D-Day' : '여행 중'
  }

  return '완료'
}

function formatDateRange(startDate: string, endDate: string): string {
  const toDisplay = (d: string) => {
    const [, month, day] = d.split('-')
    return `${Number(month)}.${Number(day)}`
  }
  return `${toDisplay(startDate)} ~ ${toDisplay(endDate)}`
}

type Props = AlbumListItem

function getDeletionDDay(deleteRequestedAt: string): number {
  const deleteDate = parseISO(deleteRequestedAt)
  deleteDate.setDate(deleteDate.getDate() + 7)
  return differenceInCalendarDays(deleteDate, startOfDay(new Date()))
}

export function AlbumCard({
  id,
  title,
  startDate,
  endDate,
  coverImageUrl,
  destinationName,
  myRole,
  memberCount,
  deleteRequestedAt,
}: Props): React.JSX.Element {
  const ddayLabel = getDDayLabel(startDate, endDate)
  const isDone = ddayLabel === '완료'
  const deletionDDay = deleteRequestedAt ? getDeletionDDay(deleteRequestedAt) : null

  return (
    <Link href={`/albums/${id}`} className="album-card block animate-slide-up">
      {/* 삭제 예정 배너 */}
      {deletionDDay !== null && (
        <div
          role="alert"
          style={{
            background: 'var(--color-terracotta)',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            padding: '6px var(--space-4)',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          {deletionDDay <= 0 ? '곧 삭제돼요' : `${deletionDDay}일 후 삭제 예정`}
        </div>
      )}

      {/* 커버 이미지 */}
      <div
        className="album-card__cover"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-bg-surface)',
        }}
      >
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ aspectRatio: '16/7' }}
          >
            <span
              className="text-display-lg"
              style={{ color: 'var(--color-ink-disabled)' }}
              aria-hidden
            >
              ✈
            </span>
          </div>
        )}
      </div>

      {/* 카드 본문 */}
      <div className="album-card__body">
        <h2 className="album-card__title">{title}</h2>
        <p className="album-card__meta">
          {destinationName ? `${destinationName} · ` : ''}
          {formatDateRange(startDate, endDate)}
          {' · '}
          {memberCount}명
        </p>

        <div className="album-card__footer">
          <span className={`role-badge ${ROLE_CLASS[myRole]}`}>
            {ROLE_LABELS[myRole]}
          </span>
          <span
            className="dday-badge"
            style={isDone ? { color: 'var(--color-ink-muted)' } : undefined}
          >
            {ddayLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}
