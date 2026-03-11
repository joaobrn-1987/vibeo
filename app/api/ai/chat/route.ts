import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendToAI } from "@/lib/ai"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const { messages, sessionId } = await req.json()
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  // Get user context for the AI
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { currentRiskLevel: true, riskScore: true, streakDays: true },
  })

  const lastCheckIn = await prisma.emotionalCheckIn.findFirst({
    where: { userId: session.user.id, isComplete: true },
    orderBy: { completedAt: "desc" },
    select: { overallMood: true },
  })

  const result = await sendToAI(messages, {
    riskLevel: profile?.currentRiskLevel,
    recentMood: lastCheckIn?.overallMood || undefined,
    streakDays: profile?.streakDays,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 503 })
  }

  // Save AI session if sessionId provided
  if (sessionId) {
    await prisma.aISession.updateMany({
      where: { id: sessionId, userId: session.user.id },
      data: {
        messages: [...messages, { role: "assistant", content: result.content }],
      },
    }).catch(() => {}) // non-critical
  }

  return NextResponse.json({ content: result.content })
}
