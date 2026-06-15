'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { saveDiary, deleteDiary } from '@/actions/diary'
import type { DiaryEntry } from '@/queries/diary'

interface DiaryEditFormProps {
  albumId: string
  date: string
  existingEntry?: DiaryEntry
}

type FormValues = {
  content: string
}

function draftKey(albumId: string, date: string): string {
  return `draft:diary:${albumId}:${date}`
}

export function DiaryEditForm({
  albumId,
  date,
  existingEntry,
}: DiaryEditFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!existingEntry
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: { content: existingEntry?.content ?? '' },
  })

  const content = watch('content')

  // 마운트 시: localStorage draft 확인 → 복원 제안
  useEffect(() => {
    const key = draftKey(albumId, date)
    const saved = localStorage.getItem(key)
    if (!saved) return
    // 기존 저장된 일기와 같으면 draft 무시
    if (existingEntry && saved === existingEntry.content) {
      localStorage.removeItem(key)
      return
    }
    // 현재 폼 값과 같으면 무시
    if (saved === (existingEntry?.content ?? '')) return

    toast('임시 저장된 일기가 있어요', {
      duration: 6000,
      action: {
        label: '불러오기',
        onClick: () => {
          setValue('content', saved)
          toast.success('임시 저장 내용을 불러왔어요')
        },
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // content 변경 시 1s debounce 자동 저장
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const key = draftKey(albumId, date)
      if (content.trim()) {
        localStorage.setItem(key, content)
      } else {
        localStorage.removeItem(key)
      }
    }, 1000)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [content, albumId, date])

  function onSubmit(values: FormValues): void {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('albumId', albumId)
      formData.set('date', date)
      formData.set('content', values.content)

      const result = await saveDiary(null, formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      // 저장 성공 시 draft 삭제
      localStorage.removeItem(draftKey(albumId, date))
      toast.success(isEdit ? '일기를 수정했어요' : '일기를 저장했어요')
      router.push(`/albums/${albumId}/memories`)
    })
  }

  function handleDelete(): void {
    startTransition(async () => {
      const result = await deleteDiary(albumId, date)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      localStorage.removeItem(draftKey(albumId, date))
      toast.success('일기를 삭제했어요')
      router.push(`/albums/${albumId}/memories`)
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
    >
      <Textarea
        label="오늘의 여행 이야기"
        rows={12}
        placeholder="오늘 어떤 여행을 했나요? 느꼈던 것들을 자유롭게 적어보세요..."
        error={errors.content?.message}
        {...register('content', {
          required: '내용을 입력해주세요',
          maxLength: { value: 1000, message: '1,000자 이하로 입력해주세요' },
        })}
      />
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-ink-muted)',
          textAlign: 'right',
          marginTop: 'calc(var(--space-1) * -1)',
        }}
      >
        {content.length} / 1,000
      </p>

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
            일기 삭제
          </Button>
        )}
      </div>
    </form>
  )
}
