import * as React from "react"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = {
  default: { container: "bg-blue-50 border-blue-200 text-blue-800", icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /> },
  success: { container: "bg-green-50 border-green-200 text-green-800", icon: <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> },
  warning: { container: "bg-amber-50 border-amber-200 text-amber-800", icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" /> },
  error: { container: "bg-red-50 border-red-200 text-red-800", icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> },
  safety: { container: "bg-primary-50 border-primary-200 text-primary-800", icon: <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" /> },
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants
  title?: string
  description?: string
}

export function Alert({ className, variant = "default", title, description, children, ...props }: AlertProps) {
  const config = alertVariants[variant]

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 p-4 rounded-2xl border",
        config.container,
        className
      )}
      {...props}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {description && <p className="text-sm mt-0.5 opacity-80 leading-relaxed">{description}</p>}
        {children}
      </div>
    </div>
  )
}
