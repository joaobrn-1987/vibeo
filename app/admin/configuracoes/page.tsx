import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ConfiguracoesClient } from "@/components/admin/configuracoes-client"

export const metadata = { title: "Configurações – Admin" }

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } })
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return (
    <ConfiguracoesClient
      currentEmail={session.user.email!}
      registrationsBlocked={settingsMap["REGISTRATIONS_BLOCKED"] === "true"}
      smtpHost={settingsMap["SMTP_HOST"] || ""}
      smtpPort={settingsMap["SMTP_PORT"] || "587"}
      smtpUser={settingsMap["SMTP_USER"] || ""}
      smtpPass={settingsMap["SMTP_PASS"] || ""}
      smtpFrom={settingsMap["SMTP_FROM"] || ""}
    />
  )
}
