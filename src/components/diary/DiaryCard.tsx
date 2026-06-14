import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { PencilIcon } from 'lucide-react'
import type { DiaryEntry } from '@/queries/diary'

interface DiaryCardProps {
  entry: DiaryEntry
  isMyEntry: boolean
  albumId: string
}

export function DiaryCard({ entry, isMyEntry, albumId }: DiaryCardProps): React.JSX.Element {
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
            {entry.author.nickname}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
            {format(parseISO(entry.date), 'M월 d일 (E)', { locale: ko })}
          </span>
        </div>
        {isMyEntry && (
          <Link
            href={`/albums/${albumId}/diary/${entry.date}/edit`}
            aria-label="일기 수정"
            style={{
              width: 'var(--touch-min)',
              height: 'var(--touch-min)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-ink-muted)',
              flexShrink: 0,
            }}
          >
            <PencilIcon size={16} />
          </Link>
        )}
      </div>

      <p
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-ink)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}
      >
        {entry.content}
      </p>
    </div>
  )
}
