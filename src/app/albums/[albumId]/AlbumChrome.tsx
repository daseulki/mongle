'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontalIcon } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlbumTabNav } from '@/components/album/AlbumTabNav'
import { useAlbumContext } from './AlbumContext'
import { SelectedDateProvider } from './SelectedDateContext'
import { AlbumDateBar } from './AlbumDateBar'

interface AlbumChromeProps {
  albumId: string
  children: React.ReactNode
}

/**
 * Renders the album header, delete banner, shared date bar, and tab nav — but
 * only on the two tab routes (itinerary and photo/diary). Sub-routes (members,
 * settings, record editor, photo detail) bring their own header, so they render
 * without this chrome.
 */
export function AlbumChrome({ albumId, children }: AlbumChromeProps): React.JSX.Element {
  const pathname = usePathname()
  const { album } = useAlbumContext()

  const isTabRoute =
    pathname === `/albums/${albumId}` || pathname === `/albums/${albumId}/memories`

  if (!isTabRoute) return <>{children}</>

  return (
    <AppLayout>
      <PageHeader
        title={album.title}
        backHref="/"
        showBack
        rightSlot={
          <Link
            href={`/albums/${albumId}/members`}
            aria-label="멤버 및 설정"
            style={{
              width: 'var(--touch-min)',
              height: 'var(--touch-min)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-ink)',
            }}
          >
            <MoreHorizontalIcon size={20} />
          </Link>
        }
      />

      {/* M-03 삭제 예정 배너 */}
      {album.deleteRequestedAt &&
        (() => {
          const deleteDate = parseISO(album.deleteRequestedAt)
          deleteDate.setDate(deleteDate.getDate() + 7)
          const dDay = differenceInCalendarDays(deleteDate, new Date())
          return (
            <div
              role="alert"
              style={{
                background: 'var(--color-terracotta)',
                color: '#fff',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                padding: '8px var(--page-padding)',
                textAlign: 'center',
                letterSpacing: '0.02em',
              }}
            >
              {dDay <= 0 ? '이 앨범은 곧 삭제돼요' : `이 앨범은 ${dDay}일 후 삭제 예정이에요`}
            </div>
          )
        })()}

      <SelectedDateProvider>
        <AlbumDateBar />
        <AlbumTabNav albumId={albumId} />
        {children}
      </SelectedDateProvider>
    </AppLayout>
  )
}
