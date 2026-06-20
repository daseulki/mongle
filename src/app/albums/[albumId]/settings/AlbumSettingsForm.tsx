'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Trash2Icon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ImageUploadPicker } from '@/components/ui/ImageUploadPicker'
import { updateAlbum, requestAlbumDeletion, cancelAlbumDeletion, type UpdateAlbumInput } from '@/actions/album'
import type { AlbumDetail } from '@/queries/albums'

interface AlbumSettingsFormProps {
  album: AlbumDetail
  /** Owner는 모든 항목을, 코호스트는 커버 이미지만 수정할 수 있다. */
  isOwner: boolean
}

function DeleteConfirmModal({
  albumTitle,
  onConfirm,
  onCancel,
  isPending,
}: {
  albumTitle: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}): React.JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: 'var(--space-6) var(--page-padding) var(--space-8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h2
            id="delete-modal-title"
            style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}
          >
            앨범을 삭제할까요?
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)', lineHeight: 1.6 }}>
            <strong>"{albumTitle}"</strong> 앨범의 삭제를 요청합니다.{'\n'}
            요청 후 7일이 지나면 모든 사진, 일정, 일기가 영구 삭제되며 되돌릴 수 없어요.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? '처리 중...' : '7일 후 삭제 예약'}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            style={{ width: '100%' }}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AlbumSettingsForm({ album, isOwner }: AlbumSettingsFormProps): React.JSX.Element {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(album.coverImageUrl)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<UpdateAlbumInput>({
    defaultValues: {
      title: album.title,
      startDate: album.startDate,
      endDate: album.endDate,
      destinationName: album.destinationName ?? '',
    },
  })

  const onSave = (values: UpdateAlbumInput): void => {
    setIsSaving(true)
    void (async () => {
      const result = await updateAlbum(album.id, { ...values, coverImageUrl })
      if (!result || !result.success) {
        toast.error(result?.error ?? '저장에 실패했어요')
      } else {
        toast.success('앨범 정보가 수정됐어요')
        router.back()
      }
      setIsSaving(false)
    })()
  }

  const handleDeleteConfirm = (): void => {
    setIsDeleting(true)
    void (async () => {
      const result = await requestAlbumDeletion(album.id)
      if (!result || !result.success) {
        toast.error(result?.error ?? '삭제 요청에 실패했어요')
        setIsDeleting(false)
      } else {
        toast.success('앨범 삭제가 예약됐어요. 7일 후 영구 삭제됩니다')
        router.push('/')
      }
      setShowDeleteModal(false)
    })()
  }

  const handleCancelDeletion = (): void => {
    setIsCancelling(true)
    void (async () => {
      const result = await cancelAlbumDeletion(album.id)
      if (!result || !result.success) {
        toast.error(result?.error ?? '취소에 실패했어요')
      } else {
        toast.success('앨범 삭제 예약이 취소됐어요')
        router.refresh()
      }
      setIsCancelling(false)
    })()
  }

  return (
    <>
      <main
        className="page-content"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <form
          onSubmit={handleSubmit(onSave)}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
          noValidate
        >
          {/* 커버 이미지 */}
          <ImageUploadPicker
            type="cover"
            currentUrl={coverImageUrl}
            onChange={setCoverImageUrl}
            albumId={album.id}
            aspectRatio="16/7"
          />

          {isOwner && (
            <>
              <Input
                label="여행 이름"
                id="title"
                type="text"
                placeholder="30자 이하"
                maxLength={30}
                error={errors.title?.message}
                {...register('title', {
                  required: '여행 이름을 입력해주세요',
                  maxLength: { value: 30, message: '30자 이하로 입력해주세요' },
                })}
              />

              <Input
                label="목적지"
                id="destinationName"
                type="text"
                placeholder="선택 사항"
                maxLength={50}
                error={errors.destinationName?.message}
                {...register('destinationName', {
                  maxLength: { value: 50, message: '50자 이하로 입력해주세요' },
                })}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--color-ink-soft)',
                  }}
                >
                  여행 기간
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    id="startDate"
                    type="date"
                    className="form-input"
                    style={{ flex: 1 }}
                    {...register('startDate', { required: '시작일을 선택해주세요' })}
                  />
                  <span style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }}>~</span>
                  <input
                    id="endDate"
                    type="date"
                    className="form-input"
                    style={{ flex: 1 }}
                    {...register('endDate', {
                      required: '종료일을 선택해주세요',
                      validate: (v) => {
                        const start = getValues('startDate')
                        if (v < start) return '종료일이 시작일보다 빨라요'
                        if (differenceInCalendarDays(parseISO(v), parseISO(start)) > 30)
                          return '최대 30일이에요'
                        return true
                      },
                    })}
                  />
                </div>
                {(errors.startDate || errors.endDate) && (
                  <p
                    role="alert"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-terracotta)' }}
                  >
                    {errors.startDate?.message ?? errors.endDate?.message}
                  </p>
                )}
              </div>
            </>
          )}

          <Button type="submit" disabled={isSaving} style={{ width: '100%' }}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </form>

        {/* 위험 구역 — owner 전용 */}
        {isOwner && (
        <div
          style={{
            marginTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-ink-disabled)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            위험 구역
          </p>
          {album.deleteRequestedAt ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancelDeletion}
                disabled={isCancelling}
                style={{ width: '100%' }}
              >
                {isCancelling ? '취소 중...' : '삭제 예약 취소'}
              </Button>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-terracotta)',
                  lineHeight: 1.6,
                }}
              >
                이 앨범은 삭제 예약 중이에요. 취소하면 삭제가 중단됩니다.
              </p>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                style={{ width: '100%', gap: 'var(--space-2)' }}
              >
                <Trash2Icon size={16} />
                앨범 삭제 요청
              </Button>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-ink-muted)',
                  lineHeight: 1.6,
                }}
              >
                삭제 요청 시 7일 후 앨범의 모든 데이터가 영구 삭제됩니다.
              </p>
            </>
          )}
        </div>
        )}
      </main>

      {showDeleteModal && (
        <DeleteConfirmModal
          albumTitle={album.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          isPending={isDeleting}
        />
      )}
    </>
  )
}
