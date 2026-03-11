export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Heart } from "lucide-react"
import { RecursosClient } from "@/components/admin/recursos-client"

export const metadata = { title: "Recursos de Apoio – Admin" }

export default async function RecursosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const resources = await prisma.supportResource.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })

  const serialized = resources.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    phone: r.phone,
    type: r.type,
    targetRisk: r.targetRisk,
    isActive: r.isActive,
    order: r.order,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center">
          <Heart className="w-5 h-5 text-accent-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Recursos de apoio</h1>
          <p className="text-sm text-foreground/50">{resources.length} recurso{resources.length !== 1 ? "s" : ""} cadastrado{resources.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <RecursosClient resources={serialized} />
    </div>
  )
}
