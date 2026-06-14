'use client'

import { useWeather, type WeatherDay } from '@/queries/weather'
import { getWeatherMeta } from '@/lib/weather/classify'
import { Skeleton } from '@/components/ui/skeleton'

function WeatherDayCell({ day }: { day: WeatherDay }): React.JSX.Element {
  const meta = getWeatherMeta(day.weatherCode)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minWidth: 52,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }} aria-label={meta.label}>
        {meta.emoji}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          color: 'var(--color-ink)',
        }}
      >
        {day.tempMax}°
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-ink-muted)',
        }}
      >
        {day.tempMin}°
      </span>
    </div>
  )
}

function WeatherSkeleton(): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--page-padding)',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            minWidth: 52,
          }}
        >
          <Skeleton style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <Skeleton style={{ width: 24, height: 12 }} />
          <Skeleton style={{ width: 20, height: 12 }} />
        </div>
      ))}
    </div>
  )
}

interface WeatherWidgetProps {
  albumId: string
  /** Only show weather for these dates (the album's date range) */
  dates: string[]
}

/**
 * Horizontal weather strip for the itinerary date bar.
 * Gracefully hides when data is unavailable.
 */
export function WeatherWidget({ albumId, dates }: WeatherWidgetProps): React.JSX.Element | null {
  const { data: weather, isLoading, isError } = useWeather(albumId)

  if (isLoading) return <WeatherSkeleton />
  if (isError || !weather || weather.length === 0) return null

  const dateSet = new Set(dates)
  const visible = weather.filter((w) => dateSet.has(w.date))
  if (visible.length === 0) return null

  return (
    <div
      role="region"
      aria-label="날씨 정보"
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--page-padding)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        background: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {visible.map((day) => (
        <WeatherDayCell key={day.date} day={day} />
      ))}
    </div>
  )
}
