'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AlbumTabNavProps {
  albumId: string
}

function AlbumTabNav({ albumId }: AlbumTabNavProps): React.JSX.Element {
  const pathname = usePathname()
  const isMemories = pathname.endsWith('/memories')

  return (
    <nav
      aria-label="앨범 탭"
      style={{ padding: `var(--space-3) var(--page-padding)` }}
    >
      <div className="tab-bar" role="tablist">
        <Link
          href={`/albums/${albumId}`}
          className="tab-bar__item"
          role="tab"
          aria-selected={!isMemories}
        >
          일정
        </Link>
        <Link
          href={`/albums/${albumId}/memories`}
          className="tab-bar__item"
          role="tab"
          aria-selected={isMemories}
        >
          사진·일기
        </Link>
      </div>
    </nav>
  )
}

export { AlbumTabNav }
