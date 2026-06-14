'use client'

import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string
  error?: string
}

function Textarea({
  className,
  label,
  error,
  id,
  ...props
}: TextareaProps): React.JSX.Element {
  const generatedId = React.useId()
  const textareaId = id ?? generatedId

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-ink-soft"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        data-slot="textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={cn(
          "min-h-[120px] w-full bg-card px-4 py-3 text-base text-foreground",
          "rounded-[var(--radius-md)] border border-input",
          "transition-colors outline-none resize-none",
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
          id={`${textareaId}-error`}
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

export { Textarea }
