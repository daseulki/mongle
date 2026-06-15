'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOutIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, type UpdateProfileState } from '@/actions/profile'
import { ImageUploadPicker } from '@/components/ui/ImageUploadPicker'

interface ProfileSettingsFormProps {
  nickname: string
  email: string
  avatarUrl: string | null
}

export function ProfileSettingsForm({
  nickname,
  email,
  avatarUrl: avatarUrl_prop,
}: ProfileSettingsFormProps): React.JSX.Element {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<UpdateProfileState, FormData>(
    updateProfile,
    null,
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(avatarUrl_prop)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main
      className="page-content"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      {/* 프로필 이미지 */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-2)' }}>
        <ImageUploadPicker
          type="avatar"
          currentUrl={avatarUrl}
          onChange={setAvatarUrl}
          avatarSize={80}
        />
      </div>

      {/* 닉네임 수정 폼 */}
      <form
        action={formAction}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <input type="hidden" name="avatarUrl" value={avatarUrl ?? ''} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label
            htmlFor="nickname"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
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
            defaultValue={nickname}
            placeholder="2~20자"
            minLength={2}
            maxLength={20}
            required
            autoComplete="nickname"
          />
          {state && !state.success && (
            <p
              role="alert"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-terracotta)' }}
            >
              {state.error}
            </p>
          )}
          {state && state.success && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sage)' }}>
              닉네임이 저장됐어요
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            height: 'var(--touch-comfort)',
            backgroundColor: isPending ? 'var(--color-amber-light)' : 'var(--color-amber)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'background-color var(--duration-fast)',
          }}
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
      </form>

      {/* 연결된 계정 */}
      <section
        style={{
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-ink-disabled)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 'var(--space-2)',
          }}
        >
          연결된 계정
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-4xl)',
              background: '#fff',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#4285F4',
              flexShrink: 0,
            }}
          >
            G
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-soft)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {email}
          </span>
        </div>
      </section>

      {/* 로그아웃 */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-5)',
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-ink-soft)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-2) 0',
          }}
        >
          <LogOutIcon size={18} />
          로그아웃
        </button>
      </div>
    </main>
  )
}
