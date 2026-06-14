'use client'

import { useTransition } from 'react'
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
import type { ItineraryItem } from '@/queries/itinerary'

type FormValues = {
  placeName: string
  scheduledTime: string
  memo: string
}

interface ItineraryFormProps {
  albumId: string
  date: string
  item?: ItineraryItem
}

function formatDisplayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'M월 d일 (E)', { locale: ko })
  } catch {
    return dateStr
  }
}

function ItineraryForm({ albumId, date, item }: ItineraryFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!item

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      placeName: item?.placeName ?? '',
      scheduledTime: item?.scheduledTime ?? '',
      memo: item?.memo ?? '',
    },
  })

  function onSubmit(values: FormValues): void {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('albumId', albumId)
      formData.set('date', date)
      formData.set('placeName', values.placeName)
      formData.set('scheduledTime', values.scheduledTime)
      formData.set('memo', values.memo)

      const action = isEdit
        ? ((_: unknown, fd: FormData) => {
            fd.set('itemId', item!.id)
            return updateItineraryItem(null, fd)
          })(null, formData)
        : createItineraryItem(null, formData)

      const result = await action
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

      {/* 시간 (선택) */}
      <Input
        label="시간 (선택)"
        placeholder="09:00"
        error={errors.scheduledTime?.message}
        {...register('scheduledTime', {
          pattern: {
            value: /^(\d{2}:\d{2})?$/,
            message: '올바른 시간 형식으로 입력해주세요 (예: 09:00)',
          },
        })}
      />

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
