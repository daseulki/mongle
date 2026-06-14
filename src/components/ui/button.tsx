import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground text-base hover:bg-primary/85 active:bg-primary/95 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground text-base border border-border hover:bg-surface active:bg-surface/80",
        ghost:
          "text-foreground text-base hover:bg-surface active:bg-surface/80",
        outline:
          "border-2 border-primary bg-transparent text-primary text-base hover:bg-accent active:bg-accent/80",
        destructive:
          "bg-destructive/10 text-destructive text-base hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-amber underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5",
        sm: "h-9 gap-1.5 px-4 text-sm rounded-[var(--radius-sm)]",
        lg: "h-12 gap-2 px-6",
        xs: "h-7 gap-1 px-3 text-xs rounded-[var(--radius-sm)]",
        icon: "size-11",
        "icon-sm": "size-9 rounded-[var(--radius-sm)]",
        "icon-lg": "size-12",
        "icon-xs": "size-7 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>): React.JSX.Element {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
