import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateToken, calculateAge } from "@/lib/utils"
import { z } from "zod"

const registerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  birthDate: z.string(),
  age: z.number(),
  isMinor: z.boolean(),
  theme: z.enum(["FEMININE", "MASCULINE", "DIVERSITY"]),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")).optional(),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    if (!data.acceptTerms || !data.acceptPrivacy) {
      return NextResponse.json({ error: "Você deve aceitar os termos e a política de privacidade." }, { status: 400 })
    }

    if (data.isMinor && (!data.guardianName || !data.guardianEmail)) {
      return NextResponse.json({ error: "Responsável legal é obrigatório para menores de 18 anos." }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const birthDate = new Date(data.birthDate)

    // Get active terms and privacy versions
    const terms = await prisma.termsOfUse.findFirst({ where: { isActive: true } })
    const privacy = await prisma.privacyPolicy.findFirst({ where: { isActive: true } })

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "USER",
        status: data.isMinor ? "PENDING_CONSENT" : "PENDING_EMAIL",
        isMinor: data.isMinor,
      },
    })

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        birthDate,
        age: data.age,
        theme: data.theme,
      },
    })

    // Record consent
    if (terms || privacy) {
      await prisma.consentLog.create({
        data: {
          userId: user.id,
          consentType: "terms_and_privacy",
          termsVersionId: terms?.id,
          privacyVersionId: privacy?.id,
          accepted: true,
          acceptedAt: new Date(),
          ipAddress: ip,
          userAgent,
        },
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        resource: "users",
        resourceId: user.id,
        ipAddress: ip,
        userAgent,
      },
    })

    if (data.isMinor) {
      // Create guardian consent record
      const consentToken = generateToken(48)
      await prisma.guardianConsent.create({
        data: {
          minorUserId: user.id,
          guardianName: data.guardianName!,
          guardianEmail: data.guardianEmail!,
          status: "PENDING",
          consentToken,
          termsVersion: terms?.version,
          privacyVersion: privacy?.version,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      // TODO: send guardian email (would use nodemailer in production)
      console.log(`Guardian consent email would be sent to: ${data.guardianEmail}`)
      console.log(`Consent link: ${process.env.NEXT_PUBLIC_APP_URL}/consentimento/${consentToken}`)
    } else {
      // Create email verification token
      const verifyToken = generateToken(48)
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: verifyToken,
          type: "email_verification",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      // TODO: send verification email
      console.log(`Email verification would be sent to: ${data.email}`)
      console.log(`Verify link: ${process.env.NEXT_PUBLIC_APP_URL}/verificar-email/${verifyToken}`)

      // For development: auto-verify email
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "ACTIVE", emailVerified: new Date() },
      })
    }

    return NextResponse.json({ success: true, message: "Conta criada com sucesso." })
  } catch (error: any) {
    console.error("Register error:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 })
  }
}
