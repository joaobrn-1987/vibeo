export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { AlertasClient } from "@/components/admin/alertas-client"

export const metadata = { title: "Alertas – Admin" }

export default async function AlertasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const alerts = await prisma.emotionalAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      profile: { select: { fullName: true, userId: true } },
    },
  })

  const pending = alerts.filter((a) => !a.isResolved).length
  const highRisk = alerts.filter((a) => !a.isResolved && (a.riskLevel === "HIGH_RISK" || a.riskLevel === "IMMEDIATE_PRIORITY")).length

  const serialized = alerts.map((a) => ({
    id: a.id,
    alertType: a.alertType,
    riskLevel: a.riskLevel,
    message: a.message,
    isRead: a.isRead,
    isResolved: a.isResolved,
    resolvedAt: a.resolvedAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
    profile: { fullName: a.profile.fullName, userId: a.profile.userId },
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Alertas emocionais</h1>
          <p className="text-sm text-foreground/50">
            {pending} pendente{pending !== 1 ? "s" : ""}
            {highRisk > 0 && <span className="text-red-500 font-semibold"> · {highRisk} de alto risco</span>}
          </p>
        </div>
      </div>

      {highRisk > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Atenção: há {highRisk} alerta{highRisk !== 1 ? "s" : ""} de alto risco pendente{highRisk !== 1 ? "s" : ""}.</p>
            <p className="text-red-600/80 text-xs mt-0.5">Usuários marcados com risco elevado ou imediato requerem atenção prioritária.</p>
          </div>
        </div>
      )}

      <AlertasClient alerts={serialized} showResolved={false} />
    </div>
  )
}
