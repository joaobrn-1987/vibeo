import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { id, action } = await req.json()
  if (!id || !action) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  if (action === "resolve") {
    await prisma.emotionalAlert.update({
      where: { id },
      data: { isResolved: true, isRead: true, resolvedAt: new Date(), resolvedBy: session.user.id },
    })
  } else if (action === "read") {
    await prisma.emotionalAlert.update({ where: { id }, data: { isRead: true } })
  }

  return NextResponse.json({ success: true })
}
