'use client'

import { useTransition } from 'react'
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

export function DiaryEditForm({
  albumId,
  date,
  existingEntry,
}: DiaryEditFormProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!existingEntry

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    defaultValues: { content: existingEntry?.content ?? '' },
  })

  const content = watch('content')

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
