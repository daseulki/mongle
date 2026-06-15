'use client'

import { useActionState, useState } from 'react'
import { createUserProfile, type ProfileFormState } from '@/actions/profile'
import { ImageUploadPicker } from '@/components/ui/ImageUploadPicker'

type Props = {
  defaultNickname: string
  googleAvatarUrl: string | null
}

export function ProfileForm({ defaultNickname, googleAvatarUrl }: Props): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<ProfileFormState, FormData>(
    createUserProfile,
    null,
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(googleAvatarUrl)

  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-10) var(--space-6) var(--space-8)',
        minHeight: '100dvh',
      }}
    >
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h1 className="text-display-lg" style={{ color: 'var(--color-ink)' }}>
            프로필을 설정해주세요
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)' }}>
            여행 앨범에서 사용할 이름과 사진이에요
          </p>
        </div>

        {/* 폼 */}
        <form
          action={formAction}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
        >
          {/* 아바타 */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ImageUploadPicker
              type="avatar"
              currentUrl={avatarUrl}
              onChange={setAvatarUrl}
              avatarSize={88}
            />
          </div>
          {/* avatarUrl을 FormData로 전달 */}
          <input type="hidden" name="avatarUrl" value={avatarUrl ?? ''} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label
              htmlFor="nickname"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-ink-soft)',
              }}
            >
              닉네임
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              className="form-input"
              defaultValue={defaultNickname}
              placeholder="2~20자 이내"
              maxLength={20}
              required
              autoFocus
              autoComplete="nickname"
            />
            {state?.error && (
              <p
                role="alert"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-terracotta)' }}
              >
                {state.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              height: 'var(--touch-comfort)',
              backgroundColor: isPending ? 'var(--color-terracotta-light)' : 'var(--color-terracotta)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'background-color var(--duration-fast)',
              marginTop: 'var(--space-2)',
            }}
          >
            {isPending ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
