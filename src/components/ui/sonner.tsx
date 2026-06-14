"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps): React.JSX.Element => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-center"
      duration={3000}
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--color-bg-card)",
          "--normal-text": "var(--color-ink)",
          "--normal-border": "var(--color-border-default)",
          "--border-radius": "var(--radius-md)",
          "--font-family": "var(--font-body)",
          "--mobile-offset": "env(safe-area-inset-bottom)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
