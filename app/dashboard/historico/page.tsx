import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Calendar } from "lucide-react"
import { formatDate, getRiskLevelLabel } from "@/lib/utils"

export const metadata = { title: "Histórico" }

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const checkIns = await prisma.emotionalCheckIn.findMany({
    where: { userId: session.user.id, isComplete: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <History className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Histórico de check-ins</h1>
          <p className="text-sm text-foreground/50">{checkIns.length} check-ins registrados</p>
        </div>
      </div>

      {checkIns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="font-semibold text-foreground/50">Nenhum check-in ainda.</p>
            <p className="text-sm text-foreground/30 mt-1">Faça seu primeiro check-in para ver o histórico aqui!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkIns.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{moodEmoji[c.overallMood || 5]}</div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {formatDate(c.createdAt, "EEEE, dd/MM/yyyy")}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-foreground/40">Humor: <strong>{c.overallMood}/10</strong></span>
                        {c.energyLevel && <span className="text-xs text-foreground/40">Energia: <strong>{c.energyLevel}/10</strong></span>}
                        {c.anxietyLevel && <span className="text-xs text-foreground/40">Ansiedade: <strong>{c.anxietyLevel}/10</strong></span>}
                        {c.dominantFeeling && <span className="text-xs text-foreground/40">{c.dominantFeeling}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={riskVariant[c.riskLevel || "STABLE"] || "stable"}>
                    {getRiskLevelLabel(c.riskLevel || "STABLE")}
                  </Badge>
                </div>
                {c.freeText && (
                  <p className="mt-3 text-sm text-foreground/60 bg-cream-100 rounded-xl p-3 leading-relaxed italic">
                    "{c.freeText}"
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
