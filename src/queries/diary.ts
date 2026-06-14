import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { diaryKeys } from '@/queries/keys'

export type DiaryEntry = {
  id: string
  albumId: string
  userId: string
  date: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    nickname: string
    avatarUrl: string | null
  }
}

/**
 * Fetches all diary entries for an album with author info,
 * ordered by date descending.
 */
export function useDiaryEntries(albumId: string): UseQueryResult<DiaryEntry[]> {
  const supabase = createClient()

  return useQuery({
    queryKey: diaryKeys.byAlbum(albumId),
    queryFn: async (): Promise<DiaryEntry[]> => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, album_id, user_id, date, content, created_at, updated_at, author:users!inner(nickname, avatar_url)')
        .eq('album_id', albumId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => {
        const author = row.author as { nickname: string; avatar_url: string | null }
        return {
          id: row.id,
          albumId: row.album_id,
          userId: row.user_id,
          date: row.date,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          author: {
            nickname: author.nickname,
            avatarUrl: author.avatar_url,
          },
        }
      })
    },
    staleTime: 30 * 1000,
  })
}
