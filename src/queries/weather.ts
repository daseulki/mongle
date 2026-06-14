import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { weatherKeys } from '@/queries/keys'
import { toWeatherStage, type WeatherStage } from '@/lib/weather/classify'

export type WeatherDay = {
  date: string
  tempMax: number
  tempMin: number
  /** 0-4 stage (맑음→눈) */
  weatherCode: WeatherStage
  isForecast: boolean
}

type RawWeatherDay = {
  date: string
  temp_max: number
  temp_min: number
  weather_code: number
  is_forecast: boolean
  fetched_at: string
}

/**
 * Fetches weather data for an album by calling the fetch-weather Edge Function.
 * Gracefully returns an empty array on failure.
 * @param albumId the album to fetch weather for
 */
export function useWeather(albumId: string): UseQueryResult<WeatherDay[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: weatherKeys.byAlbum(albumId),
    queryFn: async (): Promise<WeatherDay[]> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-weather`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ albumId }),
      })

      if (!res.ok) return []

      const json = (await res.json()) as { weather?: RawWeatherDay[] }
      const rows = json.weather ?? []

      return rows.map((r) => ({
        date: r.date,
        tempMax: Math.round(r.temp_max),
        tempMin: Math.round(r.temp_min),
        weatherCode: toWeatherStage(r.weather_code),
        isForecast: r.is_forecast,
      }))
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours — matches backend cache window
    retry: 0, // graceful hide on failure, no retries
    enabled: !!albumId,
  })
}
