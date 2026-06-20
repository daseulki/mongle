'use client'

import { eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface DateBarProps {
  startDate: string
  endDate: string
  selectedDate: string
  onSelect: (date: string) => void
}

function DateBar({ startDate, endDate, selectedDate, onSelect }: DateBarProps): React.JSX.Element {
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  const isFill = days.length <= 7

  return (
    <div
      className={`date-bar${isFill ? ' date-bar--fill' : ''}`}
      role="tablist"
      aria-label="날짜 선택"
    >
      {days.map((day, index) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const isSelected = dateStr === selectedDate
        const dayOfWeek = DAY_LABELS[day.getDay()]
        const dayNum = format(day, 'd', { locale: ko })

        return (
          <button
            key={dateStr}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={`${index + 1}일차 (${dayOfWeek})`}
            className="date-chip"
            onClick={() => onSelect(dateStr)}
          >
            <span className="date-chip__day">{dayOfWeek}</span>
            <span className="date-chip__num">{dayNum}</span>
          </button>
        )
      })}
    </div>
  )
}

export { DateBar }
export type { DateBarProps }
