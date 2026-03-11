import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendToAI, assessChatRisk } from "@/lib/ai"

const RISK_ORDER = ["STABLE", "ATTENTION", "HIGH_RISK", "IMMEDIATE_PRIORITY"]

function isHigherRisk(a: string, b: string) {
  return RISK_ORDER.indexOf(a) > RISK_ORDER.indexOf(b)
}

// GET — carrega sessão ativa do usuário (histórico do chat)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const aiSession = await prisma.aISession.findFirst({
    where: { userId: session.user.id, sessionType: "conversation", isComplete: false },
    orderBy: { startedAt: "desc" },
  })

  if (!aiSession) return NextResponse.json({ messages: [], sessionId: null })

  return NextResponse.json({
    messages: aiSession.messages as Array<{ role: string; content: string }>,
    sessionId: aiSession.id,
  })
}

// POST — envia mensagem, salva sessão e avalia risco
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { messages, sessionId } = await req.json()
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  // Get user context for the AI
  const [profile, lastCheckIn] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { currentRiskLevel: true, riskScore: true, streakDays: true },
    }),
    prisma.emotionalCheckIn.findFirst({
      where: { userId: session.user.id, isComplete: true },
      orderBy: { completedAt: "desc" },
      select: { overallMood: true },
    }),
  ])

  const result = await sendToAI(messages, {
    riskLevel: profile?.currentRiskLevel,
    recentMood: lastCheckIn?.overallMood || undefined,
    streakDays: profile?.streakDays,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 503 })
  }

  const updatedMessages = [...messages, { role: "assistant", content: result.content }]

  // Assess risk from all user messages
  const userTexts = messages.filter((m: any) => m.role === "user").map((m: any) => m.content as string)
  const { riskLevel: detectedRisk, flags } = assessChatRisk(userTexts)

  // Upsert AISession
  let activeSessionId = sessionId
  if (activeSessionId) {
    await prisma.aISession.update({
      where: { id: activeSessionId },
      data: {
        messages: updatedMessages,
        riskFlagsDetected: flags,
        riskLevel: detectedRisk as any,
      },
    }).catch(() => {})
  } else {
    const newSession = await prisma.aISession.create({
      data: {
        userId: session.user.id,
        sessionType: "conversation",
        messages: updatedMessages,
        riskFlagsDetected: flags,
        riskLevel: detectedRisk as any,
      },
    })
    activeSessionId = newSession.id
  }

  // Escalate profile risk level if chat detected higher risk
  const currentRisk = profile?.currentRiskLevel || "STABLE"
  if (isHigherRisk(detectedRisk, currentRisk)) {
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        currentRiskLevel: detectedRisk as any,
        lastRiskAssessment: new Date(),
      },
    }).catch(() => {})

    // Create alert for HIGH_RISK or IMMEDIATE_PRIORITY
    if (detectedRisk === "HIGH_RISK" || detectedRisk === "IMMEDIATE_PRIORITY") {
      const profileRecord = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (profileRecord) {
        await prisma.emotionalAlert.create({
          data: {
            profileId: profileRecord.id,
            alertType: detectedRisk === "IMMEDIATE_PRIORITY" ? "RISK_IMMEDIATE" : "RISK_ELEVATED",
            riskLevel: detectedRisk as any,
            message: `Sinais de risco detectados no chat: ${flags.join(", ")}`,
            triggeredBy: `chat_session:${activeSessionId}`,
          },
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ content: result.content, sessionId: activeSessionId })
}
