import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendToAI, assessChatRisk, UserMemory } from "@/lib/ai"

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

  // Fetch rich context for AI memory
  const [profile, recentCheckIns, pastSessions] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { fullName: true, socialName: true, age: true, currentRiskLevel: true, streakDays: true },
    }),
    prisma.emotionalCheckIn.findMany({
      where: { userId: session.user.id, isComplete: true },
      orderBy: { completedAt: "desc" },
      take: 7,
      select: {
        completedAt: true,
        overallMood: true,
        energyLevel: true,
        anxietyLevel: true,
        sleepQuality: true,
        dominantFeeling: true,
        freeText: true,
        riskLevel: true,
      },
    }),
    prisma.aISession.findMany({
      where: {
        userId: session.user.id,
        sessionType: "conversation",
        isComplete: true,
        ...(sessionId ? { NOT: { id: sessionId } } : {}),
      },
      orderBy: { startedAt: "desc" },
      take: 3,
      select: { startedAt: true, messages: true, riskLevel: true },
    }),
  ])

  const tz = process.env.TZ || "America/Sao_Paulo"
  const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric" }).format(d)

  const userMemory: UserMemory = {
    name: profile?.socialName || profile?.fullName,
    age: profile?.age,
    riskLevel: profile?.currentRiskLevel,
    streakDays: profile?.streakDays,
    recentMood: recentCheckIns[0]?.overallMood ?? undefined,
    recentCheckIns: recentCheckIns.map((c) => ({
      date: c.completedAt ? fmt(c.completedAt) : "—",
      overallMood: c.overallMood,
      energyLevel: c.energyLevel,
      anxietyLevel: c.anxietyLevel,
      sleepQuality: c.sleepQuality,
      dominantFeeling: c.dominantFeeling,
      freeText: c.freeText,
      riskLevel: c.riskLevel as string,
    })),
    pastSessionSummaries: pastSessions.map((s) => {
      const msgs = (s.messages as Array<{ role: string; content: string }>)
        .filter((m) => m.role === "user")
        .map((m) => m.content)
      return {
        date: fmt(s.startedAt),
        userMessages: msgs,
        riskLevel: s.riskLevel as string,
      }
    }),
  }

  const result = await sendToAI(messages, userMemory)

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
