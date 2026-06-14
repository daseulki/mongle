import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { photoKeys } from '@/queries/keys'

export type PhotoItem = {
  id: string
  albumId: string
  date: string
  cdnUrl: string
  storageKey: string
  fileSizeBytes: number
  width: number | null
  height: number | null
  uploadedBy: string
  createdAt: string
}

/**
 * Fetches all photos for an album, ordered by date descending then upload time.
 */
export function usePhotos(albumId: string): UseQueryResult<PhotoItem[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: photoKeys.byAlbum(albumId),
    queryFn: async (): Promise<PhotoItem[]> => {
      const { data, error } = await supabase
        .from('photos')
        .select('id, album_id, date, cdn_url, storage_key, file_size_bytes, width, height, uploaded_by, created_at')
        .eq('album_id', albumId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        albumId: row.album_id,
        date: row.date,
        cdnUrl: row.cdn_url,
        storageKey: row.storage_key,
        fileSizeBytes: row.file_size_bytes,
        width: row.width,
        height: row.height,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
      }))
    },
    staleTime: 30 * 1000,
  })
}
