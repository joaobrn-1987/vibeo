import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { formatDate, getRiskLevelLabel, getRiskLevelColor } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Detalhes do Check-in" }

const moodEmoji: Record<number, string> = {
  1: "😭", 2: "😢", 3: "😟", 4: "😕", 5: "😐",
  6: "🙂", 7: "😊", 8: "😄", 9: "🤩", 10: "🥳",
}

const riskVariant: Record<string, "stable" | "attention" | "high" | "immediate"> = {
  STABLE: "stable",
  ATTENTION: "attention",
  HIGH_RISK: "high",
  IMMEDIATE_PRIORITY: "immediate",
}

function ScoreBar({ value, max = 10, label }: { value: number | null; max?: number; label: string }) {
  if (!value) return null
  const pct = (value / max) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-foreground/60">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{value}/{max}</span>
      </div>
      <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function CheckInDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const checkIn = await prisma.emotionalCheckIn.findUnique({
    where: { id: params.id },
    include: { answers: { include: { question: true } } },
  })

  if (!checkIn || checkIn.userId !== session.user.id) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/historico" className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao histórico
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{moodEmoji[checkIn.overallMood || 5]}</div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              {formatDate(checkIn.createdAt, "EEEE, dd/MM/yyyy HH:mm")}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={riskVariant[checkIn.riskLevel || "STABLE"] || "stable"}>
                {getRiskLevelLabel(checkIn.riskLevel || "STABLE")}
              </Badge>
              {checkIn.dominantFeeling && (
                <span className="text-sm text-foreground/50">{checkIn.dominantFeeling}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas do check-in</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <ScoreBar value={checkIn.overallMood} label="Humor geral" />
          <ScoreBar value={checkIn.energyLevel} label="Nível de energia" />
          <ScoreBar value={checkIn.anxietyLevel} label="Ansiedade" />
          <ScoreBar value={checkIn.sleepQuality} label="Qualidade do sono" />
          <ScoreBar value={checkIn.irritability} label="Irritabilidade" />
          <ScoreBar value={checkIn.motivation} label="Motivação" />
          <ScoreBar value={checkIn.appetite} label="Apetite" />
        </CardContent>
      </Card>

      {/* Texto livre */}
      {checkIn.freeText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como você estava se sentindo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground/70 leading-relaxed italic bg-cream-50 rounded-xl p-4">
              "{checkIn.freeText}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Flags de risco */}
      {checkIn.riskFlags && checkIn.riskFlags.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-base text-orange-700">Indicadores identificados</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {checkIn.riskFlags.map((flag, i) => (
                <li key={i} className="text-sm text-orange-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Respostas adicionais */}
      {checkIn.answers && checkIn.answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Respostas do questionário</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {checkIn.answers.map((a) => (
              <div key={a.id} className="border-b border-cream-100 last:border-0 pb-3 last:pb-0">
                <p className="text-xs font-semibold text-foreground/50 mb-0.5">{a.question.shortLabel}</p>
                <p className="text-sm text-foreground">{a.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metadados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do registro</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/50">Registrado em</span>
            <span className="font-medium">{formatDate(checkIn.createdAt, "dd/MM/yyyy HH:mm")}</span>
          </div>
          {checkIn.completedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground/50">Concluído em</span>
              <span className="font-medium">{formatDate(checkIn.completedAt, "dd/MM/yyyy HH:mm")}</span>
            </div>
          )}
          {checkIn.internalScore !== null && checkIn.internalScore !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-foreground/50">Score interno</span>
              <span className="font-medium">{checkIn.internalScore.toFixed(1)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-foreground/50">Nível de risco</span>
            <span className={`font-medium text-xs px-2 py-0.5 rounded-full border ${getRiskLevelColor(checkIn.riskLevel || "STABLE")}`}>
              {getRiskLevelLabel(checkIn.riskLevel || "STABLE")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
