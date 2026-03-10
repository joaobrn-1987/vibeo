import { Heart } from "lucide-react"

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }

  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-4 border-cream-200 border-t-primary-500`} />
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-cream-100 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-hover animate-bounce-gentle">
          <Heart className="w-8 h-8 text-white" fill="currentColor" />
        </div>
        <div>
          <p className="font-display font-bold text-xl text-primary-700">Vibeo</p>
          <p className="text-sm text-foreground/40 text-center mt-1">Carregando...</p>
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="vibeo-card p-6 space-y-3">
      <div className="skeleton h-4 w-32 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-3/4 rounded" />
    </div>
  )
}
