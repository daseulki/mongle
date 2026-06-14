'use client'

import { createContext, useContext } from 'react'
import type { AlbumDetail, AlbumMember } from '@/queries/albums'
import type { Database } from '@/types/database'

type MemberRole = Database['public']['Enums']['member_role']

export type AlbumContextValue = {
  album: AlbumDetail
  members: AlbumMember[]
  myRole: MemberRole
  myUserId: string
}

const AlbumContext = createContext<AlbumContextValue | null>(null)

export function AlbumProvider({
  value,
  children,
}: {
  value: AlbumContextValue
  children: React.ReactNode
}): React.JSX.Element {
  return <AlbumContext.Provider value={value}>{children}</AlbumContext.Provider>
}

/**
 * Provides album context (detail, members, myRole) for client components
 * inside the /albums/[albumId]/ route segment.
 */
export function useAlbumContext(): AlbumContextValue {
  const ctx = useContext(AlbumContext)
  if (!ctx) throw new Error('useAlbumContext must be used within AlbumProvider')
  return ctx
}
