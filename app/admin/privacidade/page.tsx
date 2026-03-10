import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Shield, Database, FileText, Users, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "Privacidade & LGPD – Admin" }

export default async function PrivacidadeAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [
    totalConsents,
    guardianConsents,
    activeTerms,
    activePrivacy,
    retentionRules,
    recentAuditLogs,
    dataExports,
  ] = await Promise.all([
    prisma.consentLog.count(),
    prisma.guardianConsent.count(),
    prisma.termsOfUse.findFirst({ where: { isActive: true } }),
    prisma.privacyPolicy.findFirst({ where: { isActive: true } }),
    prisma.dataRetentionRule.findMany({ where: { isActive: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.dataExportRequest.count({ where: { status: "pending" } }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Privacidade, LGPD e Governança</h1>
        <p className="text-foreground/50 mt-1">Gerencie conformidade, dados pessoais e governança da plataforma.</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Logs de consentimento", value: totalConsents, icon: <FileText className="w-5 h-5 text-primary-600" />, bg: "bg-primary-50 border-primary-100" },
          { label: "Consentimentos de responsáveis", value: guardianConsents, icon: <Users className="w-5 h-5 text-accent-600" />, bg: "bg-accent-50 border-accent-100" },
          { label: "Solicitações de dados pendentes", value: dataExports, icon: <Database className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50 border-amber-100" },
          { label: "Regras de retenção", value: retentionRules.length, icon: <Shield className="w-5 h-5 text-green-600" />, bg: "bg-green-50 border-green-100" },
        ].map((item) => (
          <Card key={item.label} className="border">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${item.bg} border flex items-center justify-center mb-3`}>
                {item.icon}
              </div>
              <p className="font-display font-bold text-2xl text-foreground">{item.value}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary-500" />
              Documentos ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
              <div>
                <p className="text-sm font-semibold text-foreground">Termos de Uso</p>
                <p className="text-xs text-foreground/40">Versão {activeTerms?.version || "–"}</p>
              </div>
              <Badge variant="stable">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
              <div>
                <p className="text-sm font-semibold text-foreground">Política de Privacidade</p>
                <p className="text-xs text-foreground/40">Versão {activePrivacy?.version || "–"}</p>
              </div>
              <Badge variant="stable">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Retention rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary-500" />
              Políticas de retenção de dados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-2">
              {retentionRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
                  <div>
                    <p className="text-sm font-medium text-foreground">{rule.description || rule.dataType}</p>
                    <p className="text-xs text-foreground/40">{rule.retentionDays} dias · {rule.action === "delete" ? "Excluir" : "Anonimizar"}</p>
                  </div>
                  <Badge variant="stable">{rule.isActive ? "Ativo" : "Inativo"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-5 h-5 text-primary-500" />
            Inventário de dados coletados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50">
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-foreground/40 uppercase">Dado</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-foreground/40 uppercase">Finalidade</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-foreground/40 uppercase">Base Legal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-foreground/40 uppercase">Sensível</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dado: "Nome completo", finalidade: "Personalização da experiência", base: "Consentimento", sensivel: false },
                  { dado: "Data de nascimento", finalidade: "Verificação de menoridade e personalização", base: "Consentimento", sensivel: false },
                  { dado: "E-mail", finalidade: "Autenticação e comunicação", base: "Consentimento", sensivel: false },
                  { dado: "Respostas emocionais", finalidade: "Acompanhamento emocional longitudinal", base: "Consentimento", sensivel: true },
                  { dado: "Histórico de check-ins", finalidade: "Análise de evolução e bem-estar", base: "Consentimento", sensivel: true },
                  { dado: "Texto livre", finalidade: "Escuta ativa e personalização", base: "Consentimento", sensivel: true },
                  { dado: "IP e User-Agent", finalidade: "Segurança e auditoria", base: "Interesse legítimo", sensivel: false },
                  { dado: "Logs de acesso", finalidade: "Segurança e governança", base: "Obrigação legal", sensivel: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-cream-100 hover:bg-cream-50">
                    <td className="px-4 py-3 font-medium text-foreground">{row.dado}</td>
                    <td className="px-4 py-3 text-foreground/60">{row.finalidade}</td>
                    <td className="px-4 py-3 text-foreground/60">{row.base}</td>
                    <td className="px-4 py-3">
                      {row.sensivel ? (
                        <Badge variant="warning">Sensível</Badge>
                      ) : (
                        <Badge variant="muted">Não</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent audit logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-primary-500" />
            Logs de auditoria recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
                <div>
                  <p className="text-xs font-semibold text-foreground font-mono">{log.action}</p>
                  <p className="text-xs text-foreground/40">{log.resource} · {formatDate(log.createdAt, "dd/MM/yyyy HH:mm")}</p>
                </div>
                <p className="text-xs text-foreground/30">{log.ipAddress}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
