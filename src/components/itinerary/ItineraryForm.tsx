'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
} from '@/actions/itinerary'
import { TIME_PERIODS, TIME_PERIOD_LABEL } from '@/lib/itinerary/timePeriod'
import type { ItineraryItem, ItineraryTimePeriod } from '@/queries/itinerary'

type TimeMode = 'unset' | 'period' | 'exact'

type FormValues = {
  placeName: string
  memo: string
}

interface ItineraryFormProps {
  albumId: string
  date: string
  item?: ItineraryItem
}

const TIME_MODES: { value: TimeMode; label: string }[] = [
  { value: 'unset', label: '미정' },
  { value: 'period', label: '시간대' },
  { value: 'exact', label: '정확히' },
]

function formatDisplayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'M월 d일 (E)', { locale: ko })
  } catch {
    return dateStr
  }
}

function initialTimeMode(item?: ItineraryItem): TimeMode {
  if (item?.scheduledTime) return 'exact'
  if (item?.timePeriod) return 'period'
  return 'unset'
}

function ItineraryForm({ albumId, date, item }: ItineraryFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!item

  const [timeMode, setTimeMode] = useState<TimeMode>(() => initialTimeMode(item))
  const [period, setPeriod] = useState<ItineraryTimePeriod | ''>(item?.timePeriod ?? '')
  const [exactTime, setExactTime] = useState(item?.scheduledTime ?? '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      placeName: item?.placeName ?? '',
      memo: item?.memo ?? '',
    },
  })

  function changeTimeMode(mode: TimeMode): void {
    setTimeMode(mode)
    // 모드 전환 시 이전 모드 입력값 초기화 (상호 배타)
    if (mode !== 'period') setPeriod('')
    if (mode !== 'exact') setExactTime('')
  }

  function onSubmit(values: FormValues): void {
    if (timeMode === 'period' && !period) {
      toast.error('시간대를 선택해주세요')
      return
    }
    if (timeMode === 'exact' && !exactTime) {
      toast.error('시간을 입력해주세요')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('albumId', albumId)
      formData.set('date', date)
      formData.set('placeName', values.placeName)
      formData.set('scheduledTime', timeMode === 'exact' ? exactTime : '')
      formData.set('timePeriod', timeMode === 'period' ? period : '')
      formData.set('memo', values.memo)

      const result = isEdit
        ? await (() => {
            formData.set('itemId', item!.id)
            return updateItineraryItem(null, formData)
          })()
        : await createItineraryItem(null, formData)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? '일정을 수정했어요' : '일정을 추가했어요')
      router.push(`/albums/${albumId}`)
    })
  }

  function handleDelete(): void {
    if (!item) return
    startTransition(async () => {
      const result = await deleteItineraryItem(albumId, item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('일정을 삭제했어요')
      router.push(`/albums/${albumId}`)
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
    >
      {/* 날짜 표시 (읽기 전용) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink-soft)' }}>
          날짜
        </span>
        <div
          className="form-input"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-display)',
          }}
          aria-readonly="true"
        >
          {formatDisplayDate(date)}
        </div>
      </div>

      {/* 장소명 */}
      <Input
        label="장소명"
        required
        placeholder="예: 성산일출봉"
        error={errors.placeName?.message}
        {...register('placeName', {
          required: '장소명을 입력해주세요',
          maxLength: { value: 50, message: '50자 이하로 입력해주세요' },
        })}
      />

      {/* 시간 (선택) — 3-way 모드 */}
      <fieldset style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink-soft)', padding: 0 }}>
          시간 (선택)
        </legend>

        {/* 세그먼트 컨트롤 */}
        <div
          role="radiogroup"
          aria-label="시간 입력 방식"
          style={{
            display: 'flex',
            gap: 'var(--space-1)',
            padding: 'var(--space-1)',
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {TIME_MODES.map((mode) => {
            const active = timeMode === mode.value
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeTimeMode(mode.value)}
                style={{
                  flex: 1,
                  height: 'var(--touch-min, 40px)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--color-bg-card)' : 'transparent',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {mode.label}
              </button>
            )
          })}
        </div>

        {/* 시간대 칩 */}
        {timeMode === 'period' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {TIME_PERIODS.map((p) => {
              const active = period === p
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    border: `1px solid ${active ? 'var(--color-amber)' : 'var(--color-border-default)'}`,
                    borderRadius: 'var(--radius-full)',
                    background: active ? 'var(--color-amber)' : 'var(--color-bg-card)',
                    color: active ? '#FFFFFF' : 'var(--color-ink-soft)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {TIME_PERIOD_LABEL[p]}
                </button>
              )
            })}
          </div>
        )}

        {/* 정확한 시각 */}
        {timeMode === 'exact' && (
          <Input
            type="time"
            aria-label="정확한 시각"
            value={exactTime}
            onChange={(e) => setExactTime(e.target.value)}
          />
        )}
      </fieldset>

      {/* 메모 (선택) */}
      <Textarea
        label="메모 (선택)"
        placeholder="예: 입장료 1인 5,000원"
        rows={3}
        error={errors.memo?.message}
        {...register('memo', {
          maxLength: { value: 200, message: '200자 이하로 입력해주세요' },
        })}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? '저장 중...' : '저장'}
        </Button>

        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleDelete}
            className="w-full"
            style={{ color: 'var(--color-terracotta)' }}
          >
            <Trash2Icon size={16} />
            일정 삭제
          </Button>
        )}
      </div>
    </form>
  )
}

export { ItineraryForm }
