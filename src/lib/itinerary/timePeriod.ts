/**
 * 일정 시간 모델 공용 유틸.
 * 시간은 정렬에 관여하지 않고 표시 라벨로만 쓰이며,
 * '시간순 정렬' 보조 기능에서만 대표 시각으로 환산해 정렬에 사용한다.
 */

export type ItineraryTimePeriod = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'

export const TIME_PERIODS: readonly ItineraryTimePeriod[] = [
  'morning',
  'noon',
  'afternoon',
  'evening',
  'night',
]

export const TIME_PERIOD_LABEL: Record<ItineraryTimePeriod, string> = {
  morning: '오전',
  noon: '점심',
  afternoon: '오후',
  evening: '저녁',
  night: '밤',
}

/** '시간순 정렬'에서 시간대를 비교할 때 쓰는 대표 시각(분 단위) */
const TIME_PERIOD_MINUTES: Record<ItineraryTimePeriod, number> = {
  morning: 8 * 60,
  noon: 12 * 60,
  afternoon: 15 * 60,
  evening: 18 * 60,
  night: 21 * 60,
}

type TimedItem = {
  scheduledTime: string | null
  timePeriod: ItineraryTimePeriod | null
}

/**
 * 시간순 정렬용 비교 키(분). 정확 시각 > 시간대 순으로 환산하고,
 * 시간 미정 항목은 맨 뒤로 보낸다.
 * @param item scheduledTime / timePeriod 를 가진 일정 항목
 * @returns 정렬 기준 분(минute). 시간 미정은 Infinity
 */
export function timeSortValue(item: TimedItem): number {
  if (item.scheduledTime) {
    const [h, m] = item.scheduledTime.split(':').map(Number)
    return h * 60 + m
  }
  if (item.timePeriod) return TIME_PERIOD_MINUTES[item.timePeriod]
  return Number.POSITIVE_INFINITY
}

/**
 * 카드에 표시할 시간 라벨. 정확 시각(HH:MM) > 시간대(오전·점심…) > 없음.
 * @param item scheduledTime / timePeriod 를 가진 일정 항목
 * @returns 표시 문자열 또는 null(시간 미정)
 */
export function timeLabel(item: TimedItem): string | null {
  if (item.scheduledTime) return item.scheduledTime
  if (item.timePeriod) return TIME_PERIOD_LABEL[item.timePeriod]
  return null
}
