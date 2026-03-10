import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const RISK_KEYWORDS = [
  "suicídio", "suicidio", "me matar", "matar", "acabar com tudo",
  "não quero mais viver", "nao quero mais viver", "desaparecer",
  "autolesão", "autolesao", "me machucar", "me cortar",
]

function calculateRiskLevel(data: any): { level: string; score: number; flags: string[] } {
  const flags: string[] = []
  let riskScore = 0

  const mood = data.overallMood || 5
  const anxiety = data.anxietyLevel || 5
  const motivation = data.motivation || 5
  const energy = data.energyLevel || 5
  const freeText = (data.freeText || "").toLowerCase()

  // Check free text for risk keywords
  const hasRiskText = RISK_KEYWORDS.some(kw => freeText.includes(kw))
  if (hasRiskText) {
    flags.push("RISK_TEXT_DETECTED")
    riskScore += 50
  }

  // Low mood
  if (mood <= 2) { flags.push("VERY_LOW_MOOD"); riskScore += 20 }
  else if (mood <= 4) { flags.push("LOW_MOOD"); riskScore += 10 }

  // High anxiety
  if (anxiety >= 9) { flags.push("HIGH_ANXIETY"); riskScore += 15 }
  else if (anxiety >= 7) { flags.push("ELEVATED_ANXIETY"); riskScore += 8 }

  // Low motivation
  if (motivation <= 2) { flags.push("LOW_MOTIVATION"); riskScore += 8 }

  // Low energy
  if (energy <= 2) { flags.push("LOW_ENERGY"); riskScore += 5 }

  // Sentiment
  const negFeelings = ["Ansioso(a)", "Triste", "Irritado(a)", "Sobrecarregado(a)"]
  if (negFeelings.includes(data.dominantFeeling)) riskScore += 5

  let level = "STABLE"
  if (riskScore >= 50 || hasRiskText) level = "IMMEDIATE_PRIORITY"
  else if (riskScore >= 25) level = "HIGH_RISK"
  else if (riskScore >= 10) level = "ATTENTION"

  return { level, score: riskScore, flags }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await req.json()
    const { level, score, flags } = calculateRiskLevel(data)

    const checkIn = await prisma.emotionalCheckIn.create({
      data: {
        userId: session.user.id,
        isComplete: true,
        completedAt: new Date(),
        overallMood: data.overallMood,
        energyLevel: data.energyLevel,
        anxietyLevel: data.anxietyLevel,
        sleepQuality: data.sleepQuality,
        motivation: data.motivation,
        dominantFeeling: data.dominantFeeling,
        freeText: data.freeText,
        riskLevel: level as any,
        riskFlags: flags,
        internalScore: score,
      },
    })

    // Update profile stats
    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
    if (profile) {
      const lastDate = profile.lastCheckInDate
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let newStreak = profile.streakDays
      if (lastDate) {
        const last = new Date(lastDate)
        last.setHours(0, 0, 0, 0)
        if (last.getTime() === yesterday.getTime()) {
          newStreak += 1
        } else if (last.getTime() < yesterday.getTime()) {
          newStreak = 1
        }
      } else {
        newStreak = 1
      }

      await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          currentRiskLevel: level as any,
          lastCheckInDate: new Date(),
          totalCheckIns: { increment: 1 },
          streakDays: newStreak,
          lastRiskAssessment: new Date(),
          riskScore: score,
        },
      })
    }

    // Create alert if high risk
    if (level === "HIGH_RISK" || level === "IMMEDIATE_PRIORITY") {
      if (profile) {
        await prisma.emotionalAlert.create({
          data: {
            profileId: profile.id,
            alertType: level === "IMMEDIATE_PRIORITY" ? "RISK_IMMEDIATE" : "RISK_ELEVATED",
            riskLevel: level as any,
            message: `Alerta de risco detectado. Score: ${score}. Sinais: ${flags.join(", ")}.`,
            triggeredBy: checkIn.id,
          },
        })
      }

      // Security event log
      await prisma.securityEvent.create({
        data: {
          userId: session.user.id,
          eventType: "RISK_DETECTED",
          severity: level === "IMMEDIATE_PRIORITY" ? "critical" : "high",
          description: `Risk level ${level} detected during check-in. Flags: ${flags.join(", ")}`,
          metadata: { checkInId: checkIn.id, score, flags },
        },
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CHECKIN_COMPLETED",
        resource: "emotional_checkins",
        resourceId: checkIn.id,
        details: { riskLevel: level, score },
      },
    })

    return NextResponse.json({ success: true, riskLevel: level, checkInId: checkIn.id })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
