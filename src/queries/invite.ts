import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { inviteKeys } from '@/queries/keys'

export type ActiveInvite = {
  token: string
  expiresAt: string
}

/**
 * Returns the currently active invite for an album, or null if none exists.
 * Only meaningful for owners and co-hosts.
 */
export function useActiveInvite(albumId: string): UseQueryResult<ActiveInvite | null> {
  const supabase = createClient()

  return useQuery({
    queryKey: inviteKeys.active(albumId),
    queryFn: async (): Promise<ActiveInvite | null> => {
      const { data, error } = await supabase
        .from('album_invites')
        .select('token, expires_at')
        .eq('album_id', albumId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      return { token: data.token, expiresAt: data.expires_at }
    },
    staleTime: 60 * 1000,
  })
}
