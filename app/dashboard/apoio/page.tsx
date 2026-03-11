export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { HelpCircle, Phone, Globe, AlertTriangle, Heart, Users, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const metadata = { title: "Recursos de Apoio – Vibeo" }

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  emergency: { label: "Emergência", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  professional: { label: "Profissional", icon: Heart, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  community: { label: "Comunidade", icon: Users, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  self_care: { label: "Autocuidado", icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
}

export default async function ApoioPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { currentRiskLevel: true },
  })

  const riskLevel = profile?.currentRiskLevel || "STABLE"

  // Get resources relevant to the user's risk level
  const resources = await prisma.supportResource.findMany({
    where: {
      isActive: true,
      OR: [
        { targetRisk: { has: riskLevel } },
        { targetRisk: { isEmpty: true } },
      ],
    },
    orderBy: [{ order: "asc" }, { type: "asc" }],
  })

  // Also get emergency resources always
  const emergencyResources = await prisma.supportResource.findMany({
    where: { isActive: true, type: "emergency" },
    orderBy: { order: "asc" },
  })

  const grouped: Record<string, typeof resources> = {}
  const order = ["emergency", "professional", "community", "self_care"]
  order.forEach((type) => { grouped[type] = [] })
  resources.forEach((r) => { if (!grouped[r.type]) grouped[r.type] = []; grouped[r.type].push(r) })
  // Merge emergency always
  emergencyResources.forEach((er) => {
    if (!grouped.emergency.find((r) => r.id === er.id)) grouped.emergency.push(er)
  })

  const hasResources = Object.values(grouped).some((arr) => arr.length > 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-accent-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Recursos de apoio</h1>
          <p className="text-sm text-foreground/50">Serviços e recursos para o seu bem-estar</p>
        </div>
      </div>

      {/* Crisis banner always visible */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">Em caso de emergência</p>
              <p className="text-sm text-red-700/80 mt-0.5">
                Ligue para o <strong>CVV: 188</strong> (24h, gratuito) ou <strong>SAMU: 192</strong> se precisar de ajuda imediata.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasResources && (
        <Card>
          <CardContent className="p-12 text-center text-foreground/40">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum recurso disponível no momento.</p>
            <p className="text-xs mt-1">O administrador ainda não cadastrou recursos de apoio.</p>
          </CardContent>
        </Card>
      )}

      {order.map((type) => {
        const list = grouped[type]
        if (!list || list.length === 0) return null
        const cfg = TYPE_CONFIG[type]
        return (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 text-base ${cfg.color}`}>
                <cfg.icon className="w-5 h-5" />
                {cfg.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {list.map((resource) => (
                <div key={resource.id} className={`p-4 rounded-xl border ${cfg.bg}`}>
                  <p className="font-semibold text-foreground text-sm">{resource.title}</p>
                  {resource.description && (
                    <p className="text-xs text-foreground/60 mt-1">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {resource.phone && (
                      <a href={`tel:${resource.phone.replace(/\D/g, "")}`}
                        className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.color} hover:underline`}>
                        <Phone className="w-4 h-4" />
                        {resource.phone}
                      </a>
                    )}
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-sm font-semibold ${cfg.color} hover:underline`}>
                        <Globe className="w-4 h-4" />
                        Acessar site
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      <p className="text-xs text-foreground/40 text-center pb-4">
        Estes recursos são sugeridos com base no seu nível de bem-estar atual.
        Em situações de risco imediato, sempre ligue 192 (SAMU) ou 188 (CVV).
      </p>
    </div>
  )
}
