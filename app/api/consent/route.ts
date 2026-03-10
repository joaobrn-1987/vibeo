import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { token, action } = await req.json()
    if (!token || !["approve", "deny"].includes(action)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    }

    const consent = await prisma.guardianConsent.findUnique({
      where: { consentToken: token },
      include: { minorUser: true },
    })

    if (!consent) return NextResponse.json({ error: "Token inválido." }, { status: 404 })
    if (consent.status !== "PENDING") return NextResponse.json({ error: "Consentimento já processado." }, { status: 409 })
    if (new Date() > consent.expiresAt) return NextResponse.json({ error: "Token expirado." }, { status: 410 })

    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    if (action === "approve") {
      await prisma.guardianConsent.update({
        where: { consentToken: token },
        data: {
          status: "APPROVED",
          consentedAt: new Date(),
          consentIp: ip,
          consentUserAgent: userAgent,
        },
      })
      await prisma.user.update({
        where: { id: consent.minorUserId },
        data: { status: "ACTIVE", emailVerified: new Date() },
      })
      await prisma.auditLog.create({
        data: {
          userId: consent.minorUserId,
          action: "GUARDIAN_CONSENT_APPROVED",
          resource: "guardian_consents",
          resourceId: consent.id,
          ipAddress: ip,
          userAgent,
        },
      })
    } else {
      await prisma.guardianConsent.update({
        where: { consentToken: token },
        data: { status: "REVOKED", revokedAt: new Date(), revokeReason: "Guardian denied consent" },
      })
      await prisma.user.update({
        where: { id: consent.minorUserId },
        data: { status: "DEACTIVATED" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Consent error:", error)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
