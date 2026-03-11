export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BarChart3, Users, Activity, TrendingUp, AlertTriangle, Calendar, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Relatórios – Admin" }

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeUsers30d,
    newUsers30d,
    totalCheckIns,
    checkInsThisWeek,
    checkInsLastMonth,
    riskDistribution,
    pendingAlerts,
    highRiskAlerts,
    recentCheckIns,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null, role: "USER" } }),
    prisma.user.count({ where: { deletedAt: null, role: "USER", lastActiveAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { deletedAt: null, role: "USER", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.emotionalCheckIn.count({ where: { isComplete: true } }),
    prisma.emotionalCheckIn.count({ where: { isComplete: true, completedAt: { gte: sevenDaysAgo } } }),
    prisma.emotionalCheckIn.count({ where: { isComplete: true, completedAt: { gte: thirtyDaysAgo } } }),
    prisma.profile.groupBy({ by: ["currentRiskLevel"], _count: { id: true } }),
    prisma.emotionalAlert.count({ where: { isResolved: false } }),
    prisma.emotionalAlert.count({ where: { isResolved: false, riskLevel: { in: ["HIGH_RISK", "IMMEDIATE_PRIORITY"] } } }),
    prisma.emotionalCheckIn.findMany({
      where: { isComplete: true, completedAt: { gte: thirtyDaysAgo } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, overallMood: true, anxietyLevel: true, riskLevel: true },
    }),
  ])

  // Group check-ins by day (last 14 days)
  const dailyCounts: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dailyCounts[d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })] = 0
  }
  recentCheckIns.forEach((ci) => {
    if (!ci.completedAt) return
    const key = new Date(ci.completedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    if (key in dailyCounts) dailyCounts[key]++
  })

  const avgMood = recentCheckIns.filter((c) => c.overallMood).reduce((sum, c) => sum + (c.overallMood || 0), 0) /
    (recentCheckIns.filter((c) => c.overallMood).length || 1)

  const riskMap: Record<string, number> = {}
  riskDistribution.forEach((r) => { riskMap[r.currentRiskLevel] = r._count.id })

  const RISK_LABELS: Record<string, string> = {
    STABLE: "Estável",
    ATTENTION: "Atenção",
    HIGH_RISK: "Alto risco",
    IMMEDIATE_PRIORITY: "Prioridade imediata",
  }
  const RISK_COLORS: Record<string, string> = {
    STABLE: "bg-green-500",
    ATTENTION: "bg-yellow-500",
    HIGH_RISK: "bg-orange-500",
    IMMEDIATE_PRIORITY: "bg-red-500",
  }

  const maxDailyCount = Math.max(...Object.values(dailyCounts), 1)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Relatórios</h1>
          <p className="text-sm text-foreground/50">Visão geral do sistema nos últimos 30 dias</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Usuários totais", value: totalUsers, sub: `+${newUsers30d} nos últimos 30 dias`, color: "text-primary-600 bg-primary-50" },
          { icon: Activity, label: "Usuários ativos (30d)", value: activeUsers30d, sub: `${totalUsers > 0 ? Math.round((activeUsers30d / totalUsers) * 100) : 0}% do total`, color: "text-green-600 bg-green-50" },
          { icon: Calendar, label: "Check-ins esta semana", value: checkInsThisWeek, sub: `${checkInsLastMonth} no mês`, color: "text-accent-600 bg-accent-50" },
          { icon: AlertTriangle, label: "Alertas pendentes", value: pendingAlerts, sub: highRiskAlerts > 0 ? `${highRiskAlerts} de alto risco` : "Sem alto risco", color: pendingAlerts > 0 ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs font-semibold text-foreground/70 mt-0.5">{kpi.label}</p>
              <p className="text-xs text-foreground/40 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-ins por dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Check-ins por dia (últimos 14 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-1.5 h-40">
              {Object.entries(dailyCounts).map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                    <div
                      className="w-full bg-primary-400 rounded-t-md transition-all"
                      style={{ height: `${(count / maxDailyCount) * 120}px`, minHeight: count > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className="text-xs text-foreground/40 writing-mode-vertical" style={{ fontSize: "9px" }}>{day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/40 mt-2 text-right">
              Humor médio: {avgMood > 0 ? avgMood.toFixed(1) : "—"}/10
            </p>
          </CardContent>
        </Card>

        {/* Distribuição de risco */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="w-4 h-4 text-accent-500" />
              Distribuição de risco atual
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {["STABLE", "ATTENTION", "HIGH_RISK", "IMMEDIATE_PRIORITY"].map((level) => {
              const count = riskMap[level] || 0
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground/70">{RISK_LABELS[level]}</span>
                    <span className="text-sm font-semibold text-foreground">{count} <span className="text-xs text-foreground/40">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${RISK_COLORS[level]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Total check-ins */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/50 font-medium">Total de check-ins completos no sistema</p>
              <p className="text-4xl font-bold text-foreground mt-1">{totalCheckIns.toLocaleString("pt-BR")}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
