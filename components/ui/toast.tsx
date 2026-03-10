"use client"
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const toastVariants = {
  default: "bg-white border-cream-200",
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-blue-50 border-blue-200",
}

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: "default" | "success" | "error" | "warning" | "info"
  title?: string
  description?: string
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
  ({ className, variant = "default", title, description, children, ...props }, ref) => {
    const icons = {
      success: <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />,
      error: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
      warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
      info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      default: null,
    }

    return (
      <ToastPrimitives.Root
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-hover transition-all",
          toastVariants[variant],
          className
        )}
        {...props}
      >
        {icons[variant]}
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
          {description && <p className="text-xs text-foreground/60 mt-0.5">{description}</p>}
          {children}
        </div>
        <ToastPrimitives.Close className="text-foreground/30 hover:text-foreground transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </ToastPrimitives.Close>
      </ToastPrimitives.Root>
    )
  }
)
Toast.displayName = "Toast"

export { ToastProvider, ToastViewport, Toast }
