'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  /** href가 있으면 Link, 없으면 router.back() */
  backHref?: string
  showBack?: boolean
  rightSlot?: React.ReactNode
  className?: string
}

function PageHeader({
  title,
  backHref,
  showBack = false,
  rightSlot,
  className,
}: PageHeaderProps): React.JSX.Element {
  const router = useRouter()

  const handleBack = () => router.back()

  return (
    <header className={cn("page-header", className)}>
      {showBack && (
        backHref ? (
          <Link
            href={backHref}
            aria-label="뒤로 가기"
            className="page-header__back"
          >
            <ChevronLeftIcon size={28} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
            className="page-header__back"
          >
            <ChevronLeftIcon size={28} />
          </button>
        )
      )}
      <h1 className={cn("page-header__title", !showBack && "ml-0")}>
        {title}
      </h1>
      {rightSlot && (
        <div className="flex items-center gap-1">
          {rightSlot}
        </div>
      )}
    </header>
  )
}

export { PageHeader }
