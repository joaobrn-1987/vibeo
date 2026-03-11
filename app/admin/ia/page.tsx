export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Brain } from "lucide-react"
import { IAClient } from "@/components/admin/ia-client"

export const metadata = { title: "Configurações de IA – Admin" }

export default async function IAPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const configs = await prisma.aIConfiguration.findMany({ orderBy: { key: "asc" } })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Configurações de IA</h1>
          <p className="text-sm text-foreground/50">Personalize o comportamento da assistente Vibe</p>
        </div>
      </div>

      <IAClient configs={configs} />
    </div>
  )
}
