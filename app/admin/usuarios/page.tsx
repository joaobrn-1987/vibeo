import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Search } from "lucide-react"
import { formatDate, getRiskLevelLabel } from "@/lib/utils"

export const metadata = { title: "Usuários – Admin" }

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const statusLabel: Record<string, string> = {
    ACTIVE: "Ativo",
    PENDING_EMAIL: "E-mail pendente",
    PENDING_CONSENT: "Consentimento pendente",
    SUSPENDED: "Suspenso",
    DEACTIVATED: "Desativado",
  }

  const statusVariant: Record<string, "stable" | "attention" | "warning" | "error" | "muted"> = {
    ACTIVE: "stable",
    PENDING_EMAIL: "warning",
    PENDING_CONSENT: "attention",
    SUSPENDED: "error",
    DEACTIVATED: "muted",
  }

  const roleLabel: Record<string, string> = {
    USER: "Usuário",
    GUARDIAN: "Responsável",
    ADMIN: "Admin",
    MASTER_ADMIN: "Master Admin",
  }

  const riskVariant: Record<string, "stable" | "attention" | "high" | "immediate"> = {
    STABLE: "stable",
    ATTENTION: "attention",
    HIGH_RISK: "high",
    IMMEDIATE_PRIORITY: "immediate",
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Usuários</h1>
            <p className="text-sm text-foreground/50">{users.length} usuários cadastrados</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Perfil</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Risco</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Check-ins</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-foreground/40 uppercase tracking-wider">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-cream-100 hover:bg-cream-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 flex items-center justify-center text-white font-semibold text-xs">
                          {user.profile?.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.profile?.fullName || "–"}</p>
                          <p className="text-xs text-foreground/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={(statusVariant[user.status] || "muted") as any}>
                        {statusLabel[user.status] || user.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-foreground/60">{roleLabel[user.role] || user.role}</span>
                        {user.isMinor && <Badge variant="warning" className="text-xs w-fit">Menor</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {user.profile?.currentRiskLevel && (
                        <Badge variant={riskVariant[user.profile.currentRiskLevel] || "stable"}>
                          {getRiskLevelLabel(user.profile.currentRiskLevel)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-foreground/60">{user.profile?.totalCheckIns || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-foreground/60 text-xs">{formatDate(user.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
