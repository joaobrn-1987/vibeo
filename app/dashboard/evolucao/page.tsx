export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TrendingUp, Calendar, Flame, Activity, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Evolução – Vibeo" }

const RISK_LABELS: Record<string, string> = {
  STABLE: "Estável", ATTENTION: "Atenção", HIGH_RISK: "Alto risco", IMMEDIATE_PRIORITY: "Prioridade imediata",
}
const RISK_COLORS: Record<string, string> = {
  STABLE: "text-green-600 bg-green-50 border-green-200",
  ATTENTION: "text-yellow-600 bg-yellow-50 border-yellow-200",
  HIGH_RISK: "text-orange-600 bg-orange-50 border-orange-200",
  IMMEDIATE_PRIORITY: "text-red-600 bg-red-50 border-red-200",
}

export default async function EvolucaoPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [profile, checkIns] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.emotionalCheckIn.findMany({
      where: { userId: session.user.id, isComplete: true, completedAt: { gte: thirtyDaysAgo } },
      orderBy: { completedAt: "asc" },
      select: {
        id: true, completedAt: true, overallMood: true, anxietyLevel: true,
        energyLevel: true, sleepQuality: true, riskLevel: true,
      },
    }),
  ])

  if (!profile) redirect("/dashboard")

  // Group by day
  const now = new Date()
  const dailyData: Array<{ date: string; mood: number | null; count: number }> = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const dayCheckins = checkIns.filter((ci) => ci.completedAt?.toISOString().split("T")[0] === dateStr)
    const avgMood = dayCheckins.filter((c) => c.overallMood).length > 0
      ? dayCheckins.filter((c) => c.overallMood).reduce((sum, c) => sum + (c.overallMood || 0), 0) / dayCheckins.filter((c) => c.overallMood).length
      : null
    dailyData.push({ date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), mood: avgMood, count: dayCheckins.length })
  }

  const completedCheckIns = checkIns.filter((c) => c.overallMood)
  const avgMood30d = completedCheckIns.length > 0
    ? completedCheckIns.reduce((sum, c) => sum + (c.overallMood || 0), 0) / completedCheckIns.length
    : 0
  const avgAnxiety30d = checkIns.filter((c) => c.anxietyLevel).length > 0
    ? checkIns.filter((c) => c.anxietyLevel).reduce((sum, c) => sum + (c.anxietyLevel || 0), 0) / checkIns.filter((c) => c.anxietyLevel).length
    : 0
  const avgEnergy30d = checkIns.filter((c) => c.energyLevel).length > 0
    ? checkIns.filter((c) => c.energyLevel).reduce((sum, c) => sum + (c.energyLevel || 0), 0) / checkIns.filter((c) => c.energyLevel).length
    : 0

  const maxMood = Math.max(...dailyData.map((d) => d.mood || 0), 1)
  const recentCheckIn = checkIns[checkIns.length - 1]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Minha evolução</h1>
          <p className="text-sm text-foreground/50">Acompanhe sua jornada emocional nos últimos 30 dias</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: "Check-ins (30d)", value: checkIns.length, color: "text-primary-600 bg-primary-50" },
          { icon: Flame, label: "Sequência atual", value: `${profile.streakDays}d`, color: "text-orange-600 bg-orange-50" },
          { icon: Activity, label: "Total de check-ins", value: profile.totalCheckIns, color: "text-green-600 bg-green-50" },
          { icon: Heart, label: "Humor médio (30d)", value: avgMood30d > 0 ? `${avgMood30d.toFixed(1)}/10` : "—", color: "text-accent-600 bg-accent-50" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center mb-2`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status atual */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground/60 mb-1">Nível de bem-estar atual</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${RISK_COLORS[profile.currentRiskLevel] || ""}`}>
              {RISK_LABELS[profile.currentRiskLevel] || profile.currentRiskLevel}
            </div>
          </div>
          {profile.lastRiskAssessment && (
            <p className="text-xs text-foreground/40">
              Última avaliação: {new Date(profile.lastRiskAssessment).toLocaleDateString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de humor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Humor diário (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {checkIns.length === 0 ? (
            <div className="text-center py-8 text-foreground/40">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum check-in nos últimos 30 dias.</p>
              <p className="text-xs mt-1">Complete check-ins diários para ver sua evolução aqui.</p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-0.5 h-32">
                {dailyData.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div className="w-full flex flex-col justify-end" style={{ height: "112px" }}>
                      {d.mood !== null ? (
                        <div
                          className="w-full bg-primary-400 group-hover:bg-primary-500 rounded-t-sm transition-all"
                          style={{ height: `${(d.mood / 10) * 112}px` }}
                          title={`${d.date}: ${d.mood.toFixed(1)}/10`}
                        />
                      ) : (
                        <div className="w-full bg-cream-200 rounded-t-sm" style={{ height: "4px" }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-foreground/40">
                <span>{dailyData[0]?.date}</span>
                <span className="text-center">Humor (0–10)</span>
                <span>{dailyData[dailyData.length - 1]?.date}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Médias dos indicadores */}
      {checkIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Médias dos últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {[
              { label: "Humor geral", value: avgMood30d, color: "bg-primary-400" },
              { label: "Nível de energia", value: avgEnergy30d, color: "bg-green-400" },
              { label: "Ansiedade", value: avgAnxiety30d, color: "bg-orange-400", inverted: true },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground/70">{item.label}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.value > 0 ? `${item.value.toFixed(1)}/10` : "—"}
                    {item.inverted && item.value > 0 && <span className="text-xs text-foreground/40 ml-1">(menor = melhor)</span>}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
