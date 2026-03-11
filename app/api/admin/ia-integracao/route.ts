import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { testAIConnection } from "@/lib/ai"

const INTEGRATION_KEYS = ["AI_ENABLED", "AI_API_KEY", "AI_MODEL", "AI_PROVIDER"]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: INTEGRATION_KEYS } },
  })
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const { settings } = body as { settings: Array<{ key: string; value: string }> }

  if (!settings || !Array.isArray(settings)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  // Only allow whitelisted keys
  const allowed = settings.filter((s) => INTEGRATION_KEYS.includes(s.key))

  await Promise.all(
    allowed.map((s) =>
      prisma.systemSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value, type: "string", description: s.key, isPublic: false },
      })
    )
  )

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: "UPDATE_AI_INTEGRATION",
      resource: "SystemSetting",
      details: { keys: allowed.map((s) => s.key) },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { apiKey, model, action } = await req.json()
  if (action !== "test" || !apiKey || !model) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  const result = await testAIConnection(apiKey, model)
  return NextResponse.json(result)
}
