"use client"
import Link from "next/link"
import { Bell, Home, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAdminSidebar } from "./sidebar-context"

export function AdminHeader({ user }: { user: any }) {
  const { toggle } = useAdminSidebar()

  return (
    <header className="sticky top-0 z-30 glass border-b border-cream-200 px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-cream-200 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-foreground/70" />
        </button>

        <h1 className="font-display font-bold text-lg text-foreground hidden sm:block">Painel Administrativo</h1>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Área do usuário</span>
        </Link>
        <button className="w-10 h-10 rounded-xl bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-foreground/60" />
        </button>
        <Avatar className="w-10 h-10">
          <AvatarFallback>{user.name?.charAt(0) || "A"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
