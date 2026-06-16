'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { timeLabel } from '@/lib/itinerary/timePeriod'
import type { ItineraryItem } from '@/queries/itinerary'

const CARD_COLORS = [
  'timeline__card--amber',
  'timeline__card--terracotta',
  'timeline__card--sage',
  'timeline__card--sky',
  'timeline__card--dusk',
] as const

interface ItineraryItemProps {
  item: ItineraryItem
  index: number
  canEdit: boolean
  albumId: string
}

function ItineraryItemCard({
  item,
  index,
  canEdit,
  albumId,
}: ItineraryItemProps): React.JSX.Element {
  const colorClass = CARD_COLORS[index % CARD_COLORS.length]
  const label = timeLabel(item)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !canEdit })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 2 : undefined,
    position: 'relative',
  }

  const card = (
    <div className={`timeline__card ${colorClass}`}>
      {label && <p className="timeline__time">{label}</p>}
      <p className="timeline__title">{item.placeName}</p>
      {item.memo && <p className="timeline__subtitle">{item.memo}</p>}
    </div>
  )

  if (!canEdit) {
    return (
      <div ref={setNodeRef} style={style} className="timeline__item">
        <div className="timeline__dot" aria-hidden />
        {card}
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="timeline__item">
      {/* 시각적 꼭지 (점) — 표시 전용 */}
      <span className="timeline__dot" aria-hidden style={{ pointerEvents: 'none' }} />
      {/* 꼭지 영역 전체를 덮는 드래그 핸들 */}
      <button
        type="button"
        aria-label="순서 변경 (드래그하여 이동)"
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          left: -34,
          top: 0,
          width: 34,
          height: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'grab',
          touchAction: 'none',
          zIndex: 1,
        }}
      />
      <a
        href={`/albums/${albumId}/itinerary/${item.id}/edit`}
        style={{ display: 'block', textDecoration: 'none' }}
      >
        {card}
      </a>
    </div>
  )
}

export { ItineraryItemCard }
