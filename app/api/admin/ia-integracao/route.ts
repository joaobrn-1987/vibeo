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

  const { apiKey, model, provider, action } = await req.json()
  if (!apiKey) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  // List available models for grok/openai
  if (action === "list_models") {
    const baseUrl = provider === "grok" ? "https://api.x.ai/v1" : "https://api.openai.com/v1"
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data?.error?.message || `HTTP ${res.status}` }, { status: res.status })
      const models = (data.data || []).map((m: any) => m.id).sort()
      return NextResponse.json({ models })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Erro ao listar modelos." }, { status: 500 })
    }
  }

  if (action !== "test") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  const resolvedProvider = provider || "gemini"
  const defaultModels: Record<string, string> = {
    gemini: "gemini-2.5-flash-lite",
    anthropic: "claude-haiku-4-5-20251001",
    openai: "gpt-4o-mini",
  }
  const resolvedModel = model || defaultModels[resolvedProvider] || "claude-haiku-4-5-20251001"

  const result = await testAIConnection(apiKey, resolvedModel, resolvedProvider)
  return NextResponse.json(result)
}
