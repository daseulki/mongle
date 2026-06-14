/**
 * TanStack Query key factories.
 * Always use these to build query keys — never inline strings.
 */
export const albumKeys = {
  all: ['albums'] as const,
  list: () => [...albumKeys.all, 'list'] as const,
  detail: (id: string) => [...albumKeys.all, 'detail', id] as const,
  members: (id: string) => [...albumKeys.all, 'detail', id, 'members'] as const,
}

export const photoKeys = {
  all: ['photos'] as const,
  byAlbum: (albumId: string) => [...photoKeys.all, 'album', albumId] as const,
  detail: (id: string) => [...photoKeys.all, 'detail', id] as const,
}

export const itineraryKeys = {
  all: ['itinerary'] as const,
  byAlbum: (albumId: string) => [...itineraryKeys.all, 'album', albumId] as const,
  byAlbumAndDate: (albumId: string, date: string) =>
    [...itineraryKeys.byAlbum(albumId), 'date', date] as const,
}

export const diaryKeys = {
  all: ['diary'] as const,
  byAlbum: (albumId: string) => [...diaryKeys.all, 'album', albumId] as const,
  byDate: (albumId: string, date: string) =>
    [...diaryKeys.all, 'album', albumId, 'date', date] as const,
}

export const profileKeys = {
  all: ['profiles'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
}

export const weatherKeys = {
  all: ['weather'] as const,
  byAlbum: (albumId: string) => [...weatherKeys.all, 'album', albumId] as const,
}

export const inviteKeys = {
  all: ['invites'] as const,
  active: (albumId: string) => [...inviteKeys.all, 'active', albumId] as const,
}
