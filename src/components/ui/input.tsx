'use client'

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
}

function Input({
  className,
  type,
  label,
  error,
  id,
  ...props
}: InputProps): React.JSX.Element {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-soft"
        >
          {label}
        </label>
      )}
      <InputPrimitive
        type={type}
        id={inputId}
        data-slot="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "h-12 w-full min-w-0 bg-card px-4 py-2 text-base text-foreground",
          "rounded-[var(--radius-md)] border border-input",
          "transition-colors outline-none",
          "placeholder:text-ink-disabled",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          "disabled:pointer-events-none disabled:opacity-50 disabled:bg-surface",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs"
          style={{ color: 'var(--color-terracotta)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

export { Input }
