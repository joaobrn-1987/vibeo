"use client"
import Link from "next/link"
import { Heart, TrendingUp, Calendar, Flame, Star, ChevronRight, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts"
import { formatRelative, getRiskLevelLabel } from "@/lib/utils"

interface DashboardHomeProps {
  user: {
    name: string
    fullName: string
    theme: string
    riskLevel: string
    streakDays: number
    totalCheckIns: number
    avgMood: number | null
    todayCheckedIn: boolean
    chartData: Array<{ day: string; humor: number; energia: number; sono: number }>
    lastCheckIn: { mood: number | null; dominantFeeling: string | null; createdAt: string } | null
  }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

const riskBadgeVariant: Record<string, "stable" | "attention" | "high" | "immediate"> = {
  STABLE: "stable",
  ATTENTION: "attention",
  HIGH_RISK: "high",
  IMMEDIATE_PRIORITY: "immediate",
}

export function DashboardHome({ user }: DashboardHomeProps) {
  const greeting = getGreeting()

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl text-foreground">
            {greeting}, {user.name}! ✨
          </h1>
          <p className="text-foreground/60 mt-1">
            {user.todayCheckedIn
              ? "Você já fez seu check-in hoje. Continue assim!"
              : "Que tal fazer seu check-in emocional de hoje?"}
          </p>
        </div>
        {!user.todayCheckedIn && (
          <Link href="/dashboard/check-in">
            <Button size="lg">
              <Calendar className="w-4 h-4" />
              Fazer check-in
            </Button>
          </Link>
        )}
      </div>

      {/* Risk alert if needed */}
      {(user.riskLevel === "HIGH_RISK" || user.riskLevel === "IMMEDIATE_PRIORITY") && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800 text-sm">Estamos de olho em você 💙</p>
            <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
              Percebemos que você pode estar passando por um momento mais difícil. Lembre-se: você não está sozinho(a). Se precisar de apoio, o CVV está disponível pelo número <strong>188</strong>, 24 horas por dia.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Sequência atual",
            value: `${user.streakDays} dias`,
            icon: <Flame className="w-5 h-5 text-orange-500" />,
            bg: "bg-orange-50 border-orange-100",
          },
          {
            label: "Total de check-ins",
            value: user.totalCheckIns,
            icon: <Calendar className="w-5 h-5 text-primary-600" />,
            bg: "bg-primary-50 border-primary-100",
          },
          {
            label: "Humor médio (semana)",
            value: user.avgMood ? `${user.avgMood}/10` : "–",
            icon: <Heart className="w-5 h-5 text-accent-500" />,
            bg: "bg-accent-50 border-accent-100",
          },
          {
            label: "Status atual",
            value: getRiskLevelLabel(user.riskLevel),
            icon: <Star className="w-5 h-5 text-green-500" />,
            bg: "bg-green-50 border-green-100",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} border flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="font-display font-bold text-xl text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Check-in CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Evolução dos últimos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={user.chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="colorHumor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A6FA5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4A6FA5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: "12px" }}
                      formatter={(val: any) => [`${val}/10`, ""]}
                    />
                    <Area type="monotone" dataKey="humor" stroke="#4A6FA5" strokeWidth={2.5} fill="url(#colorHumor)" dot={{ r: 4, fill: "#4A6FA5" }} name="Humor" />
                    <Line type="monotone" dataKey="energia" stroke="#E8A838" strokeWidth={2} dot={{ r: 3, fill: "#E8A838" }} name="Energia" />
                    <Line type="monotone" dataKey="sono" stroke="#A8C4D4" strokeWidth={2} dot={{ r: 3, fill: "#A8C4D4" }} name="Sono" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <Calendar className="w-10 h-10 text-foreground/20 mb-3" />
                  <p className="text-sm text-foreground/50">Faça seu primeiro check-in para ver o gráfico!</p>
                </div>
              )}
              <div className="flex gap-4 mt-2 justify-center">
                {[
                  { color: "#4A6FA5", label: "Humor" },
                  { color: "#E8A838", label: "Energia" },
                  { color: "#A8C4D4", label: "Sono" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-xs text-foreground/50">{l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          {/* Daily check-in card */}
          <Card className={user.todayCheckedIn ? "border-green-200" : "border-primary-200"}>
            <CardContent className="p-5">
              {user.todayCheckedIn ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-green-700 mb-1">Check-in feito! 🎉</p>
                  <p className="text-xs text-green-600">Você já cuidou de você hoje.</p>
                  {user.lastCheckIn && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl">
                      <p className="text-xs text-green-700">
                        Humor: <strong>{user.lastCheckIn.mood}/10</strong>
                        {user.lastCheckIn.dominantFeeling && ` · ${user.lastCheckIn.dominantFeeling}`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">Check-in de hoje</p>
                  <p className="text-xs text-foreground/50 mb-4">Como você está se sentindo?</p>
                  <Link href="/dashboard/check-in">
                    <Button className="w-full" size="sm">
                      Iniciar
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-1">Precisa de apoio?</p>
                  <p className="text-xs text-blue-700 leading-relaxed mb-2">
                    Em situações de urgência, não hesite em pedir ajuda.
                  </p>
                  <div className="flex flex-col gap-1">
                    <a href="tel:188" className="text-xs text-blue-700 font-semibold hover:underline">📞 CVV: 188 (24h, gratuito)</a>
                    <a href="tel:192" className="text-xs text-blue-700 font-semibold hover:underline">🚑 SAMU: 192</a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety disclaimer */}
      <p className="disclaimer text-center pb-4">
        O Vibeo é uma plataforma de acompanhamento emocional e não substitui atendimento psicológico, psiquiátrico ou médico.
      </p>
    </div>
  )
}
