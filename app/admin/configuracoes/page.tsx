export const dynamic = "force-dynamic"
export const metadata = { title: "Configurações – Admin" }

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ConfiguracoesClient } from "@/components/admin/configuracoes-client"

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const [settings, profile] = await Promise.all([
    prisma.systemSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.profile.findUnique({ where: { userId: session.user.id }, select: { fullName: true } }),
  ])
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return (
    <ConfiguracoesClient
      currentEmail={session.user.email!}
      currentName={profile?.fullName || session.user.name || ""}
      registrationsBlocked={settingsMap["REGISTRATIONS_BLOCKED"] === "true"}
      smtpHost={settingsMap["SMTP_HOST"] || ""}
      smtpPort={settingsMap["SMTP_PORT"] || "587"}
      smtpUser={settingsMap["SMTP_USER"] || ""}
      smtpPass={settingsMap["SMTP_PASS"] || ""}
      smtpFrom={settingsMap["SMTP_FROM"] || ""}
      aiEnabled={settingsMap["AI_ENABLED"] === "true"}
      aiApiKey={settingsMap["AI_API_KEY"] || ""}
      aiModel={settingsMap["AI_MODEL"] || "gemini-2.0-flash"}
      aiProvider={settingsMap["AI_PROVIDER"] || "gemini"}
    />
  )
}
