import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(500),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } })
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const parse = updateSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  const { key, value } = parse.data

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value, type: "string", description: key, isPublic: false },
  })

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: "UPDATE_SYSTEM_SETTING",
      resource: "SystemSetting",
      resourceId: setting.id,
      details: { key, value },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ success: true, setting })
}
