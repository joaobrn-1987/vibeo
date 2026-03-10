"use client"
import Link from "next/link"
import { Bell, Heart, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface HeaderProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export function DashboardHeader({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-cream-200 px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
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
        <button className="w-9 h-9 rounded-xl bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors relative">
          <Bell className="w-4 h-4 text-foreground/60" />
        </button>

        <Link href="/dashboard/perfil">
          <Avatar className="w-9 h-9 cursor-pointer">
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
