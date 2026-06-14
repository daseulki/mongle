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

  const inner = (
    <div className={`timeline__card ${colorClass}`}>
      {item.scheduledTime && (
        <p className="timeline__time">{item.scheduledTime}</p>
      )}
      <p className="timeline__title">{item.placeName}</p>
      {item.memo && (
        <p className="timeline__subtitle">{item.memo}</p>
      )}
    </div>
  )

  if (canEdit) {
    return (
      <div className="timeline__item">
        <div className="timeline__dot" aria-hidden />
        <a
          href={`/albums/${albumId}/itinerary/${item.id}/edit`}
          style={{ display: 'block', textDecoration: 'none' }}
        >
          {inner}
        </a>
      </div>
    )
  }

  return (
    <div className="timeline__item">
      <div className="timeline__dot" aria-hidden />
      {inner}
    </div>
  )
}

export { ItineraryItemCard }
