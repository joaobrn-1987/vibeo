export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { PerguntasClient } from "@/components/admin/perguntas-client"

export const metadata = { title: "Perguntas – Admin" }

export default async function PerguntasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN") redirect("/admin")

  const categories = await prisma.emotionalCategory.findMany({
    orderBy: { order: "asc" },
    include: { questions: { orderBy: { order: "asc" } } },
  })

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Perguntas do check-in</h1>
          <p className="text-sm text-foreground/50">
            {categories.length} categorias · {totalQuestions} pergunta{totalQuestions !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <PerguntasClient categories={categories} />
    </div>
  )
}
