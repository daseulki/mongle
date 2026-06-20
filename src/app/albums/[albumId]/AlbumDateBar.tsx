'use client'

import { DateBar } from '@/components/itinerary/DateBar'
import { useAlbumContext } from './AlbumContext'
import { useSelectedDate } from './SelectedDateContext'

/**
 * Shared date selector rendered in the album layout, above the tab nav.
 * Drives the selected date for both the itinerary and photo/diary tabs.
 */
export function AlbumDateBar(): React.JSX.Element {
  const { album } = useAlbumContext()
  const { selectedDate, setSelectedDate } = useSelectedDate()

  return (
    <DateBar
      startDate={album.startDate}
      endDate={album.endDate}
      selectedDate={selectedDate}
      onSelect={setSelectedDate}
    />
  )
}
