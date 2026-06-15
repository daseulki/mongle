import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { itineraryKeys } from '@/queries/keys'

export type ItineraryItem = {
  id: string
  albumId: string
  date: string
  placeName: string
  scheduledTime: string | null
  memo: string | null
  orderIndex: number
  createdBy: string
  createdAt: string
}

/**
 * Returns itinerary items for a specific album date,
 * sorted by scheduled_time then order_index.
 */
export function useItinerary(albumId: string, date: string): UseQueryResult<ItineraryItem[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: itineraryKeys.byAlbumAndDate(albumId, date),
    queryFn: async (): Promise<ItineraryItem[]> => {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('id, album_id, date, place_name, scheduled_time, memo, order_index, created_by, created_at')
        .eq('album_id', albumId)
        .eq('date', date)
        .order('scheduled_time', { ascending: true, nullsFirst: false })
        .order('order_index', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        albumId: row.album_id,
        date: row.date,
        placeName: row.place_name,
        scheduledTime: row.scheduled_time?.slice(0, 5) ?? null,
        memo: row.memo,
        orderIndex: row.order_index,
        createdBy: row.created_by,
        createdAt: row.created_at,
      }))
    },
    staleTime: 30 * 1000,
  })
}
