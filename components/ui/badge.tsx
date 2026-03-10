import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
  {
    variants: {
      variant: {
        default: "bg-primary-50 text-primary-700 border-primary-200",
        accent: "bg-accent-50 text-accent-700 border-accent-200",
        stable: "bg-green-50 text-green-700 border-green-200",
        attention: "bg-yellow-50 text-yellow-700 border-yellow-200",
        high: "bg-orange-50 text-orange-700 border-orange-200",
        immediate: "bg-red-50 text-red-700 border-red-200",
        muted: "bg-cream-200 text-foreground/60 border-cream-300",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        error: "bg-red-50 text-red-700 border-red-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
