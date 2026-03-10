"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, LayoutDashboard, Calendar, History, Settings, LogOut, HelpCircle, User, TrendingUp } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: { name?: string | null; email?: string | null; theme?: string; role?: string }
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/dashboard/check-in", icon: Calendar, label: "Check-in diário" },
  { href: "/dashboard/historico", icon: History, label: "Histórico" },
  { href: "/dashboard/evolucao", icon: TrendingUp, label: "Evolução" },
  { href: "/dashboard/apoio", icon: HelpCircle, label: "Recursos de apoio" },
  { href: "/dashboard/perfil", icon: User, label: "Perfil" },
  { href: "/dashboard/configuracoes", icon: Settings, label: "Configurações" },
]

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar hidden lg:flex">
        {/* Logo */}
        <div className="p-6 border-b border-cream-200">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl text-primary-700">Vibeo</span>
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-cream-200">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name || "Usuário"}</p>
              <p className="text-xs text-foreground/40 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn("admin-nav-item", isActive && "active")}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-cream-200">
          <div className="p-3 bg-blue-50 rounded-xl mb-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              Em emergências: <strong>CVV 188</strong> | <strong>SAMU 192</strong>
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="admin-nav-item w-full text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
