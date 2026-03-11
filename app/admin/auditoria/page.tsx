export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Database, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Auditoria – Admin" }

const ACTION_LABELS: Record<string, string> = {
  UPDATE_SYSTEM_SETTING: "Alteração de configuração",
  UPDATE_USER_STATUS: "Alteração de status de usuário",
  UPDATE_USER_ROLE: "Alteração de papel de usuário",
  DELETE_USER: "Exclusão de usuário",
  CREATE_TERMS: "Criação de termos",
  ACTIVATE_TERMS: "Ativação de termos",
  CREATE_PRIVACY: "Criação de política de privacidade",
  ACTIVATE_PRIVACY: "Ativação de política",
  CREATE_RESOURCE: "Criação de recurso",
  UPDATE_RESOURCE: "Atualização de recurso",
  DELETE_RESOURCE: "Exclusão de recurso",
  UPDATE_AI_CONFIG: "Atualização de configuração IA",
  RESOLVE_ALERT: "Resolução de alerta",
}

export default async function AuditoriaPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      creator: {
        select: { email: true, profile: { select: { fullName: true } } },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Logs de auditoria</h1>
          <p className="text-sm text-foreground/50">Histórico das últimas {logs.length} ações no sistema</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50">
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Data/Hora</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Ação</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Recurso</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Realizado por</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">IP</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground/60 text-xs uppercase tracking-wide">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-foreground/40">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nenhum log encontrado
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-4 py-3 text-foreground/60 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/70">{log.resource}</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {log.creator?.profile?.fullName || log.creator?.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground/50 font-mono text-xs">{log.ipAddress || "—"}</td>
                      <td className="px-4 py-3 text-foreground/50 text-xs max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
