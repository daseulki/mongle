'use client'

import { useWeather } from '@/queries/weather'
import { getWeatherMeta } from '@/lib/weather/classify'
import { Skeleton } from '@/components/ui/skeleton'

function WeatherSkeleton(): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--page-padding)',
      }}
    >
      <Skeleton style={{ width: 24, height: 24, borderRadius: '50%' }} />
      <Skeleton style={{ width: 96, height: 16 }} />
    </div>
  )
}

interface WeatherWidgetProps {
  albumId: string
  /** The currently selected date (yyyy-MM-dd) — weather is shown for this day only */
  selectedDate: string
}

/**
 * Single-line weather summary for the selected itinerary date.
 * Shows the high/low temperature and a 5-stage icon for the selected day,
 * and re-renders as the date selection changes. Gracefully hides when the
 * selected date has no weather data (e.g. failure or 17+ days in the future).
 */
export function WeatherWidget({ albumId, selectedDate }: WeatherWidgetProps): React.JSX.Element | null {
  const { data: weather, isLoading, isError } = useWeather(albumId)

  if (isLoading) return <WeatherSkeleton />
  if (isError || !weather || weather.length === 0) return null

  const day = weather.find((w) => w.date === selectedDate)
  if (!day) return null

  const meta = getWeatherMeta(day.weatherCode)

  return (
    <div
      role="region"
      aria-label="선택한 날짜의 날씨"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--page-padding)',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }} aria-label={meta.label}>
        {meta.emoji}
      </span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>
        <span style={{ fontWeight: 600 }}>{day.tempMax}°</span>
        <span style={{ color: 'var(--color-ink-muted)' }}> / {day.tempMin}°</span>
      </span>
    </div>
  )
}
