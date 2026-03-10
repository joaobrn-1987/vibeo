"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, LayoutDashboard, Users, MessageSquare, Settings, Shield, FileText, AlertTriangle, Database, BarChart3, LogOut, Brain, X } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useAdminSidebar } from "./sidebar-context"

const navGroups = [
  { label: "Visão geral", items: [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/relatorios", icon: BarChart3, label: "Relatórios" },
  ]},
  { label: "Usuários", items: [
    { href: "/admin/usuarios", icon: Users, label: "Usuários" },
    { href: "/admin/alertas", icon: AlertTriangle, label: "Alertas" },
  ]},
  { label: "Conteúdo", items: [
    { href: "/admin/perguntas", icon: MessageSquare, label: "Perguntas" },
    { href: "/admin/ia", icon: Brain, label: "Configurações de IA" },
    { href: "/admin/recursos", icon: Heart, label: "Recursos de apoio" },
  ]},
  { label: "Privacidade e LGPD", items: [
    { href: "/admin/privacidade", icon: Shield, label: "Privacidade & LGPD" },
    { href: "/admin/termos", icon: FileText, label: "Termos e Políticas" },
    { href: "/admin/auditoria", icon: Database, label: "Logs de auditoria" },
  ]},
  { label: "Sistema", items: [
    { href: "/admin/configuracoes", icon: Settings, label: "Configurações" },
  ]},
]

export function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const { isOpen, close } = useAdminSidebar()

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "admin-sidebar fixed top-0 left-0 z-50 flex flex-col h-full transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-cream-200 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={close}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-primary-700">Vibeo</span>
              <p className="text-xs text-foreground/40 -mt-0.5">Administração</p>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-200 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-cream-200">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {user.name?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user.name || "Admin"}</p>
              <p className="text-xs text-foreground/40">{user.role === "MASTER_ADMIN" ? "Master Admin" : "Administrador"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-6 py-1 text-xs font-bold text-foreground/30 uppercase tracking-wider">{group.label}</p>
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                  return (
                    <Link key={item.href} href={item.href} onClick={close}>
                      <div className={cn("admin-nav-item", isActive && "active")}>
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-cream-200">
          <button onClick={() => signOut({ callbackUrl: "/" })} className="admin-nav-item w-full text-red-400 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
