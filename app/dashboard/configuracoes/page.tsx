export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ConfiguracoesUserClient } from "@/components/dashboard/configuracoes-client"

export const metadata = { title: "Configurações – Vibeo" }

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { notificationsEnabled: true, emailNotifications: true },
  })

  if (!profile) redirect("/dashboard")

  return (
    <ConfiguracoesUserClient
      notificationsEnabled={profile.notificationsEnabled}
      emailNotifications={profile.emailNotifications}
    />
  )
}
