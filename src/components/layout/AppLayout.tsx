import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

function AppLayout({ children, className }: AppLayoutProps): React.JSX.Element {
  return (
    <div className={cn("app-layout", className)}>
      {children}
    </div>
  )
}

export { AppLayout }
