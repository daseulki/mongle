'use client'

import Link from 'next/link'
import { PlusIcon, CalendarIcon } from 'lucide-react'
import { useAlbumContext } from './AlbumContext'
import { useSelectedDate, useDateSwipe } from './SelectedDateContext'
import { useItinerary } from '@/queries/itinerary'
import { WeatherWidget } from '@/components/itinerary/WeatherWidget'
import { ItineraryList } from '@/components/itinerary/ItineraryList'
import { Skeleton } from '@/components/ui/skeleton'

function ItinerarySkeleton(): React.JSX.Element {
  return (
    <div
      className="timeline"
      style={{ marginTop: 'var(--space-4)', padding: '0 var(--page-padding)' }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="timeline__item">
          <div className="timeline__dot" aria-hidden />
          <div
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyItinerary({ canEdit, albumId, date }: { canEdit: boolean; albumId: string; date: string }): React.JSX.Element {
  return (
    <div
      className="flex flex-col items-center justify-center text-center animate-fade-in"
      style={{
        padding: 'var(--space-10) var(--page-padding)',
        gap: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CalendarIcon size={28} style={{ color: 'var(--color-ink-muted)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <p className="text-display-sm" style={{ color: 'var(--color-ink)' }}>
          일정이 없어요
        </p>
        {canEdit && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
            아래 버튼으로 첫 일정을 추가해보세요
          </p>
        )}
      </div>
      {canEdit && (
        <Link
          href={`/albums/${albumId}/itinerary/new?date=${date}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0 var(--space-5)',
            height: 'var(--touch-comfort)',
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: 'var(--color-ink-soft)',
            textDecoration: 'none',
          }}
        >
          <PlusIcon size={16} />
          일정 추가
        </Link>
      )}
    </div>
  )
}

function ItineraryClient(): React.JSX.Element {
  const { album, myRole } = useAlbumContext()
  const canEdit = myRole === 'owner' || myRole === 'co_host'

  const { selectedDate } = useSelectedDate()
  const swipe = useDateSwipe()

  const { data: items, isLoading, isError, refetch } = useItinerary(album.id, selectedDate)

  return (
    <>
      {/* 선택한 날짜의 날씨 */}
      <WeatherWidget albumId={album.id} selectedDate={selectedDate} />

      {/* 일정 목록 */}
      <main
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-6) + env(safe-area-inset-bottom))' }}
      >
        <div key={selectedDate} className="animate-fade-in">
        {isLoading && <ItinerarySkeleton />}

        {isError && (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ padding: 'var(--space-10) var(--page-padding)' }}
          >
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-soft)' }}>
              일정을 불러오는 데 실패했어요
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                marginTop: 'var(--space-3)',
                color: 'var(--color-amber)',
                fontSize: 'var(--text-sm)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !isError && items?.length === 0 && (
          <EmptyItinerary canEdit={canEdit} albumId={album.id} date={selectedDate} />
        )}

        {!isLoading && !isError && items && items.length > 0 && (
          <ItineraryList
            items={items}
            canEdit={canEdit}
            albumId={album.id}
            date={selectedDate}
          />
        )}
        </div>
      </main>

      {/* FAB — 방장/Co-host만 표시 */}
      {canEdit && (
        <div className="fab-container">
          <Link
            href={`/albums/${album.id}/itinerary/new?date=${selectedDate}`}
            className="fab"
            aria-label="일정 추가"
          >
            <PlusIcon size={26} color="#FFFFFF" className="fab__icon" />
          </Link>
        </div>
      )}
    </>
  )
}

export { ItineraryClient }
