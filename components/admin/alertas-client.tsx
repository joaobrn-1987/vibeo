"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle, Eye, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const RISK_COLORS: Record<string, string> = {
  STABLE: "bg-green-100 text-green-700",
  ATTENTION: "bg-yellow-100 text-yellow-700",
  HIGH_RISK: "bg-orange-100 text-orange-700",
  IMMEDIATE_PRIORITY: "bg-red-100 text-red-700",
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  RISK_ELEVATED: "Risco elevado",
  RISK_IMMEDIATE: "Risco imediato",
  INACTIVITY: "Inatividade",
  PATTERN_CHANGE: "Mudança de padrão",
  GUARDIAN_NOTIFICATION: "Notificação do responsável",
}

interface Alert {
  id: string
  alertType: string
  riskLevel: string
  message: string
  isRead: boolean
  isResolved: boolean
  resolvedAt: string | null
  createdAt: string
  profile: {
    fullName: string
    userId: string
  }
}

interface Props {
  alerts: Alert[]
  showResolved: boolean
}

export function AlertasClient({ alerts: initialAlerts, showResolved }: Props) {
  const router = useRouter()
  const [alerts, setAlerts] = useState(initialAlerts)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(id: string, action: "resolve" | "read") {
    setLoading(id)
    const res = await fetch("/api/admin/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? action === "resolve"
              ? { ...a, isResolved: true, isRead: true, resolvedAt: new Date().toISOString() }
              : { ...a, isRead: true }
            : a
        )
      )
      router.refresh()
    }
    setLoading(null)
  }

  const visible = showResolved ? alerts : alerts.filter((a) => !a.isResolved)

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50">
                <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Risco</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Mensagem</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-foreground/40">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum alerta pendente
                  </td>
                </tr>
              ) : (
                visible.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-cream-50 transition-colors ${!alert.isRead ? "bg-yellow-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">{alert.profile.fullName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[alert.riskLevel] || ""}`}>
                        {alert.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70 max-w-[300px]">
                      <p className="truncate">{alert.message}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground/50 whitespace-nowrap text-xs">
                      {new Date(alert.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!alert.isResolved && (
                          <>
                            {!alert.isRead && (
                              <button
                                onClick={() => handleAction(alert.id, "read")}
                                disabled={loading === alert.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                {loading === alert.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                Lido
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(alert.id, "resolve")}
                              disabled={loading === alert.id}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {loading === alert.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Resolver
                            </button>
                          </>
                        )}
                        {alert.isResolved && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Resolvido
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
