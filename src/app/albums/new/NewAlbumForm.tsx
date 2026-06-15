'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { CopyIcon, CheckIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ImageUploadPicker } from '@/components/ui/ImageUploadPicker'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { createAlbum, type CreateAlbumInput } from '@/actions/album'
import { generateInviteLink } from '@/actions/invite'
import { albumKeys } from '@/queries/keys'

function InviteBottomSheet({
  inviteUrl,
  albumId,
  onDone,
}: {
  inviteUrl: string
  albumId: string
  onDone: () => void
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(inviteUrl)
    } else {
      const el = document.createElement('textarea')
      el.value = inviteUrl
      el.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-sheet-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: 'var(--space-6) var(--page-padding) var(--space-8)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 'var(--space-1)' }} aria-hidden>✈️</div>
          <h2 id="invite-sheet-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)' }}>
            앨범이 만들어졌어요!
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)' }}>
            링크를 공유해서 멤버를 초대해보세요
          </p>
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '0 var(--space-3)', height: 48,
          }}
        >
          <span
            style={{
              flex: 1, fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-soft)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {inviteUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="링크 복사"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? 'var(--color-sage)' : 'var(--color-amber)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button onClick={handleCopy} variant="secondary" style={{ width: '100%', gap: 'var(--space-2)' }}>
            <CopyIcon size={16} />
            {copied ? '복사됨!' : '링크 복사'}
          </Button>
          <Button onClick={onDone} style={{ width: '100%' }}>
            앨범으로 가기
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NewAlbumForm(): React.JSX.Element {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [createdAlbumId, setCreatedAlbumId] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CreateAlbumInput>({
    defaultValues: {
      title: '',
      startDate: '',
      endDate: '',
      destinationName: '',
    },
  })

  function onSubmit(values: CreateAlbumInput): void {
    startTransition(async () => {
      const result = await createAlbum({ ...values, coverImageUrl: coverImageUrl ?? undefined })
      if (!result || !result.success) {
        toast.error(result?.error ?? '앨범 생성에 실패했어요')
        return
      }

      const albumId = result.albumId
      setCreatedAlbumId(albumId)
      await queryClient.invalidateQueries({ queryKey: albumKeys.list() })

      // Generate invite link automatically after creation
      const inviteResult = await generateInviteLink(albumId)
      if (inviteResult.success) {
        const origin = window.location.origin
        setInviteUrl(`${origin}/invite/${inviteResult.token}`)
      } else {
        // Invite generation failed — navigate directly
        toast.success('앨범이 만들어졌어요!')
        router.push(`/albums/${albumId}`)
      }
    })
  }

  function handleDone() {
    if (createdAlbumId) {
      router.push(`/albums/${createdAlbumId}`)
    }
  }

  return (
    <AppLayout>
      <PageHeader title="새 몽글여행 만들기" showBack />

      <main
        className="page-content"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
        >
          {/* 커버 이미지 */}
          <ImageUploadPicker
            type="cover"
            currentUrl={coverImageUrl}
            onChange={setCoverImageUrl}
            aspectRatio="16/7"
          />

          {/* 여행 이름 */}
          <Input
            label="여행 이름"
            required
            placeholder="예: 제주도 가족여행"
            error={errors.title?.message}
            {...register('title', {
              required: '여행 이름을 입력해주세요',
              maxLength: { value: 30, message: '30자 이하로 입력해주세요' },
            })}
          />

          {/* 여행 기간 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--color-ink-soft)',
              }}
            >
              여행 기간{' '}
              <span aria-hidden style={{ color: 'var(--color-terracotta)' }}>
                *
              </span>
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="date"
                  aria-label="시작일"
                  error={errors.startDate?.message}
                  {...register('startDate', {
                    required: '시작일을 선택해주세요',
                  })}
                />
              </div>
              <span
                aria-hidden
                style={{ color: 'var(--color-ink-muted)', lineHeight: '48px', flexShrink: 0 }}
              >
                ~
              </span>
              <div style={{ flex: 1 }}>
                <Input
                  type="date"
                  aria-label="종료일"
                  min={getValues('startDate') || undefined}
                  error={errors.endDate?.message}
                  {...register('endDate', {
                    required: '종료일을 선택해주세요',
                    validate: {
                      afterStart: (val) => {
                        const start = getValues('startDate')
                        if (!start) return true
                        return val >= start || '종료일이 시작일보다 빨라요'
                      },
                      maxDuration: (val) => {
                        const start = getValues('startDate')
                        if (!start || !val) return true
                        return (
                          differenceInCalendarDays(parseISO(val), parseISO(start)) <= 30 ||
                          '여행 기간은 최대 30일이에요'
                        )
                      },
                    },
                  })}
                />
              </div>
            </div>
          </div>

          {/* 목적지 (선택) */}
          <Input
            label="목적지 (선택)"
            placeholder="예: 제주도"
            error={errors.destinationName?.message}
            {...register('destinationName', {
              maxLength: { value: 50, message: '50자 이하로 입력해주세요' },
            })}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isPending ? '만드는 중...' : '앨범 만들기'}
          </Button>
        </form>
      </main>

      {/* 앨범 생성 후 초대 링크 바텀 시트 */}
      {inviteUrl && (
        <InviteBottomSheet
          inviteUrl={inviteUrl}
          albumId={createdAlbumId!}
          onDone={handleDone}
        />
      )}
    </AppLayout>
  )
}
