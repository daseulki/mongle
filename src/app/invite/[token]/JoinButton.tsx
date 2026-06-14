'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { joinAlbum } from '@/actions/invite'

interface JoinButtonProps {
  token: string
}

export function JoinButton({ token }: JoinButtonProps): React.JSX.Element {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setIsPending(true)
    setError(null)

    const result = await joinAlbum(token)

    if (result.success) {
      router.push(`/albums/${result.albumId}`)
    } else {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {error && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-terracotta)',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
      <Button
        onClick={handleJoin}
        disabled={isPending}
        size="lg"
        style={{ width: '100%' }}
      >
        {isPending ? '참여 중...' : '앨범 참여하기'}
      </Button>
    </div>
  )
}
