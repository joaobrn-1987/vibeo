"use client"
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: "primary" | "accent" | "success" | "warning" | "danger"
  }
>(({ className, value, color = "primary", ...props }, ref) => {
  const colorMap = {
    primary: "from-primary-400 to-primary-600",
    accent: "from-accent-400 to-accent-600",
    success: "from-green-400 to-green-600",
    warning: "from-amber-400 to-amber-600",
    danger: "from-red-400 to-red-600",
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-cream-200", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 bg-gradient-to-r transition-all duration-500 rounded-full", colorMap[color])}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
