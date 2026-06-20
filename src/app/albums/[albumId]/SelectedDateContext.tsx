'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { eachDayOfInterval, format, parseISO, startOfDay } from 'date-fns'
import { useAlbumContext } from './AlbumContext'

type SelectedDateValue = {
  selectedDate: string
  setSelectedDate: (date: string) => void
  dateList: string[]
}

const SelectedDateContext = createContext<SelectedDateValue | null>(null)

function getInitialDate(startDate: string, endDate: string): string {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
  if (today >= startDate && today <= endDate) return today
  if (today < startDate) return startDate
  return endDate
}

/**
 * Holds the album-wide selected date shared by the itinerary and photo/diary
 * tabs. Lives in the album layout, so the date persists across tab switches.
 */
export function SelectedDateProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const { album } = useAlbumContext()
  const [selectedDate, setSelectedDate] = useState(() =>
    getInitialDate(album.startDate, album.endDate),
  )

  const dateList = eachDayOfInterval({
    start: parseISO(album.startDate),
    end: parseISO(album.endDate),
  }).map((d) => format(d, 'yyyy-MM-dd'))

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate, dateList }}>
      {children}
    </SelectedDateContext.Provider>
  )
}

/**
 * Reads the shared selected date for the current album. Must be used within
 * SelectedDateProvider.
 */
export function useSelectedDate(): SelectedDateValue {
  const ctx = useContext(SelectedDateContext)
  if (!ctx) throw new Error('useSelectedDate must be used within SelectedDateProvider')
  return ctx
}

/**
 * Horizontal swipe handlers that move the shared selected date to the previous
 * or next day within the travel period. Used by both the itinerary and
 * photo/diary tabs. Ignores vertical scrolls and short drags.
 */
export function useDateSwipe(): {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
} {
  const { selectedDate, setSelectedDate, dateList } = useSelectedDate()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent): void {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent): void {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    const currentIndex = dateList.indexOf(selectedDate)
    if (dx < 0 && currentIndex < dateList.length - 1) {
      setSelectedDate(dateList[currentIndex + 1])
    } else if (dx > 0 && currentIndex > 0) {
      setSelectedDate(dateList[currentIndex - 1])
    }
  }

  return { onTouchStart, onTouchEnd }
}
