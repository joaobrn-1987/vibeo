import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAISettings } from "@/lib/ai"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ shouldEngage: false })

  const settings = await getAISettings()
  if (!settings.enabled) return NextResponse.json({ shouldEngage: false })

  const [profile, lastCheckIn] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { fullName: true, socialName: true, currentRiskLevel: true },
    }),
    prisma.emotionalCheckIn.findFirst({
      where: { userId: session.user.id, isComplete: true },
      orderBy: { completedAt: "desc" },
      select: { overallMood: true, riskLevel: true },
    }),
  ])

  const name = profile?.socialName || profile?.fullName || session.user.name || "você"
  const riskLevel = profile?.currentRiskLevel || "STABLE"

  let shouldEngage = false
  let greeting = ""

  if (riskLevel === "IMMEDIATE_PRIORITY" || riskLevel === "HIGH_RISK") {
    shouldEngage = true
    greeting = `Oi, ${name}. Estou pensando em você. Percebi que você pode estar passando por um momento muito difícil ultimamente. Quero muito te ouvir — você quer conversar agora? Estou aqui. 💙`
  } else if (riskLevel === "ATTENTION") {
    shouldEngage = Math.random() < 0.6
    greeting = `Olá, ${name}! Notei que você pode estar enfrentando alguns desafios. Como você está se sentindo hoje? Quer conversar um pouquinho comigo? 💙`
  } else {
    // STABLE — random 20% chance or if last mood was low
    const lowMood = lastCheckIn?.overallMood !== undefined && lastCheckIn.overallMood !== null && lastCheckIn.overallMood <= 4
    if (lowMood) {
      shouldEngage = Math.random() < 0.5
      greeting = `Oi, ${name}! Vi que você não estava no seu melhor no último check-in. Quer conversar? Estou aqui para te ouvir com carinho. 💙`
    } else {
      shouldEngage = Math.random() < 0.2
      greeting = `Oi, ${name}! Que bom te ver por aqui. Como está o seu dia? Quer conversar um pouquinho? Estou toda ouvidos. 😊`
    }
  }

  return NextResponse.json({ shouldEngage, greeting })
}
