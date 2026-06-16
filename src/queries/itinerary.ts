import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { itineraryKeys } from '@/queries/keys'
import type { ItineraryTimePeriod } from '@/lib/itinerary/timePeriod'

export type { ItineraryTimePeriod }

export type ItineraryItem = {
  id: string
  albumId: string
  date: string
  placeName: string
  scheduledTime: string | null
  timePeriod: ItineraryTimePeriod | null
  memo: string | null
  orderIndex: number
  createdBy: string
  createdAt: string
}

/**
 * Returns itinerary items for a specific album date, sorted by order_index.
 * Manual order is the single source of truth; scheduled_time / time_period
 * are display labels only and do not affect ordering.
 */
export function useItinerary(albumId: string, date: string): UseQueryResult<ItineraryItem[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: itineraryKeys.byAlbumAndDate(albumId, date),
    queryFn: async (): Promise<ItineraryItem[]> => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('id, album_id, date, place_name, scheduled_time, time_period, memo, order_index, created_by, created_at')
        .eq('album_id', albumId)
        .eq('date', date)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        albumId: row.album_id,
        date: row.date,
        placeName: row.place_name,
        scheduledTime: row.scheduled_time?.slice(0, 5) ?? null,
        timePeriod: row.time_period as ItineraryTimePeriod | null,
        memo: row.memo,
        orderIndex: row.order_index,
        createdBy: row.created_by,
        createdAt: row.created_at,
      }))
    },
    staleTime: 30 * 1000,
  })
}
