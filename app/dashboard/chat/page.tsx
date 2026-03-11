export const dynamic = "force-dynamic"
export const metadata = { title: "Chat com Vibe – Vibeo" }

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ChatClient } from "@/components/dashboard/chat-client"
import { getAISettings } from "@/lib/ai"

export default async function ChatPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [aiSettings, profile] = await Promise.all([
    getAISettings(),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { fullName: true, socialName: true },
    }),
  ])

  const displayName = (profile as any)?.socialName?.trim() || profile?.fullName || session.user.name || "você"

  return (
    <ChatClient
      aiEnabled={aiSettings.enabled}
      displayName={displayName}
    />
  )
}
