import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const configs = await prisma.aIConfiguration.findMany({ orderBy: { key: "asc" } })
  return NextResponse.json({ configs })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { key, value, description } = await req.json()
  if (!key) return NextResponse.json({ error: "key obrigatório." }, { status: 400 })

  const config = await prisma.aIConfiguration.upsert({
    where: { key },
    update: { value, ...(description ? { description } : {}) },
    create: { key, value: value || "", description, isActive: true },
  })

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: "UPDATE_AI_CONFIG",
      resource: "AIConfiguration",
      resourceId: config.id,
      details: { key, value },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ config })
}
