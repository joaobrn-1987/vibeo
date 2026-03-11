export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FileText } from "lucide-react"
import { TermosClient } from "@/components/admin/termos-client"

export const metadata = { title: "Termos e Políticas – Admin" }

export default async function TermosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const [terms, privacyPolicies] = await Promise.all([
    prisma.termsOfUse.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.privacyPolicy.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  const serializeTerms = terms.map((t) => ({
    id: t.id, version: t.version, content: t.content, summary: t.summary,
    isActive: t.isActive, publishedAt: t.publishedAt?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
  }))

  const serializePrivacy = privacyPolicies.map((p) => ({
    id: p.id, version: p.version, content: p.content, summary: p.summary,
    isActive: p.isActive, publishedAt: p.publishedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Termos e Políticas</h1>
          <p className="text-sm text-foreground/50">Gerencie os documentos legais do sistema</p>
        </div>
      </div>

      <TermosClient terms={serializeTerms} privacyPolicies={serializePrivacy} />
    </div>
  )
}
