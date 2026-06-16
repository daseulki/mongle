'use client'

import { useTransition } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownUpIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ItineraryItemCard } from './ItineraryItem'
import { reorderItineraryItems } from '@/actions/itinerary'
import { itineraryKeys } from '@/queries/keys'
import { timeSortValue } from '@/lib/itinerary/timePeriod'
import type { ItineraryItem } from '@/queries/itinerary'

interface ItineraryListProps {
  items: ItineraryItem[]
  canEdit: boolean
  albumId: string
  date: string
}

function ItineraryList({ items, canEdit, albumId, date }: ItineraryListProps): React.JSX.Element {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const queryKey = itineraryKeys.byAlbumAndDate(albumId, date)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function persistOrder(next: ItineraryItem[], previous: ItineraryItem[]): void {
    // 낙관적 업데이트: 캐시를 즉시 새 순서로 교체
    queryClient.setQueryData(queryKey, next)
    startTransition(async () => {
      const result = await reorderItineraryItems(albumId, date, next.map((i) => i.id))
      if (!result.success) {
        queryClient.setQueryData(queryKey, previous)
        toast.error('순서 변경에 실패했어요')
      }
    })
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    persistOrder(arrayMove(items, oldIndex, newIndex), items)
  }

  function handleSortByTime(): void {
    const next = [...items].sort((a, b) => timeSortValue(a) - timeSortValue(b))
    const unchanged = next.every((item, i) => item.id === items[i].id)
    if (unchanged) {
      toast.info('이미 시간순으로 정렬되어 있어요')
      return
    }
    persistOrder(next, items)
  }

  return (
    <>
      {canEdit && items.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: 'var(--space-4) var(--page-padding) 0',
          }}
        >
          <button
            type="button"
            onClick={handleSortByTime}
            disabled={isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: 'var(--space-1) var(--space-3)',
              border: 'none',
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-soft)',
              cursor: 'pointer',
            }}
          >
            <ArrowDownUpIcon size={14} />
            시간순 정렬
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="timeline" style={{ margin: 'var(--space-4) var(--page-padding) 0' }}>
            {items.map((item, index) => (
              <ItineraryItemCard
                key={item.id}
                item={item}
                index={index}
                canEdit={canEdit}
                albumId={albumId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}

export { ItineraryList }
