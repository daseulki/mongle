import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.JSX.Element> {
  const { next } = await searchParams
  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        minHeight: '100dvh',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-10)',
        }}
      >
        {/* 브랜딩 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <h1 className="text-display-xl" style={{ color: 'var(--color-amber)' }}>
            몽글여행
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-muted)',
              textAlign: 'center',
              lineHeight: 'var(--leading-loose)',
            }}
          >
            소중한 사람들과 함께한 여행을
            <br />
            하나의 앨범에 담아요
          </p>
        </div>

        {/* 로그인 영역 */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <GoogleLoginButton next={next} />
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-ink-muted)',
              textAlign: 'center',
              lineHeight: 'var(--leading-loose)',
            }}
          >
            로그인 시 서비스 이용약관과
            <br />
            개인정보처리방침에 동의하게 됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
