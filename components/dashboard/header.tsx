"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Heart, Menu, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "./sidebar-context"
import { useSession } from "next-auth/react"

interface HeaderProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export function DashboardHeader({ user }: HeaderProps) {
  const { toggle } = useSidebar()
  const { data: session } = useSession()
  const router = useRouter()
  const displayName = session?.user?.name ?? user.name
  const avatarImage = (session?.user as any)?.image ?? null
  const isAdmin = user.role === "ADMIN" || user.role === "MASTER_ADMIN"

  return (
    <header className="sticky top-0 z-30 glass border-b border-cream-200 px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-cream-200 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-foreground/70" />
        </button>

        {/* Logo — mobile only, next to hamburger */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-lg text-primary-700">Vibeo</span>
        </Link>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-foreground/50">Bem-vindo(a) de volta! 💙</p>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Admin panel link — only for admin roles */}
        {isAdmin && (
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 transition-colors font-medium"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Painel Admin</span>
          </button>
        )}
        <button className="w-10 h-10 rounded-xl bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors relative">
          <Bell className="w-4 h-4 text-foreground/60" />
        </button>

        <Link href="/dashboard/perfil">
          <Avatar className="w-10 h-10 cursor-pointer">
            {avatarImage && <AvatarImage src={avatarImage} alt={displayName || "Avatar"} />}
            <AvatarFallback>
              {displayName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
