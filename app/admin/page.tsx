import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Users, AlertTriangle, Calendar, TrendingUp, Clock, Shield, Heart, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRelative, getRiskLevelLabel } from "@/lib/utils"

export const metadata = { title: "Dashboard – Admin" }

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [
    totalUsers,
    activeUsers,
    newToday,
    pendingConsent,
    attentionUsers,
    highRiskUsers,
    immediateUsers,
    recentAlerts,
    recentCheckIns,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.user.count({ where: { status: "PENDING_CONSENT" } }),
    prisma.profile.count({ where: { currentRiskLevel: "ATTENTION" } }),
    prisma.profile.count({ where: { currentRiskLevel: "HIGH_RISK" } }),
    prisma.profile.count({ where: { currentRiskLevel: "IMMEDIATE_PRIORITY" } }),
    prisma.emotionalAlert.findMany({
      where: { isResolved: false },
      include: { profile: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.emotionalCheckIn.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
    }),
  ])

  const stats = [
    { label: "Total de usuários", value: totalUsers, icon: <Users className="w-5 h-5 text-primary-600" />, bg: "bg-primary-50 border-primary-100", change: `+${newToday} hoje` },
    { label: "Usuários ativos", value: activeUsers, icon: <Activity className="w-5 h-5 text-green-600" />, bg: "bg-green-50 border-green-100", change: "contas ativas" },
    { label: "Consentimentos pendentes", value: pendingConsent, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50 border-amber-100", change: "aguardando responsável" },
    { label: "Check-ins hoje", value: recentCheckIns, icon: <Calendar className="w-5 h-5 text-sky-600" />, bg: "bg-sky-50 border-sky-100", change: "este dia" },
    { label: "Em atenção", value: attentionUsers, icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />, bg: "bg-yellow-50 border-yellow-100", change: "monitorar" },
    { label: "Risco elevado", value: highRiskUsers, icon: <Shield className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50 border-orange-100", change: "necessita acompanhamento" },
    { label: "Prioridade imediata", value: immediateUsers, icon: <Heart className="w-5 h-5 text-red-600" />, bg: "bg-red-50 border-red-100", change: "ação necessária" },
    { label: "Alertas abertos", value: recentAlerts.length, icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: "bg-red-50 border-red-100", change: "não resolvidos" },
  ]

  const riskVariant: Record<string, "stable" | "attention" | "high" | "immediate"> = {
    STABLE: "stable",
    ATTENTION: "attention",
    HIGH_RISK: "high",
    IMMEDIATE_PRIORITY: "immediate",
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-black text-3xl text-foreground">Dashboard Administrativo</h1>
        <p className="text-foreground/50 mt-1">Visão geral da plataforma Vibeo</p>
      </div>

      {/* Immediate priority alert */}
      {immediateUsers > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">
              {immediateUsers} usuário(s) com prioridade imediata
            </p>
            <p className="text-sm text-red-600">Verifique os alertas e tome as ações necessárias.</p>
          </div>
          <a href="/admin/alertas" className="ml-auto text-sm font-semibold text-red-700 hover:text-red-900">
            Ver alertas →
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} border flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="font-display font-bold text-2xl text-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-foreground/60 mt-0.5">{stat.label}</p>
              <p className="text-xs text-foreground/30 mt-0.5">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Alertas recentes não resolvidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-6">Nenhum alerta ativo no momento.</p>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-cream-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      alert.riskLevel === "IMMEDIATE_PRIORITY" ? "bg-red-500" :
                      alert.riskLevel === "HIGH_RISK" ? "bg-orange-500" : "bg-yellow-500"
                    } animate-pulse`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {alert.profile.user?.email}
                      </p>
                      <p className="text-xs text-foreground/40">{formatRelative(alert.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={riskVariant[alert.riskLevel] || "stable"}>
                    {getRiskLevelLabel(alert.riskLevel)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
