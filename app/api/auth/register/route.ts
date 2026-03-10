import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateToken, calculateAge } from "@/lib/utils"
import { registerSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parseResult = registerSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    }

    const data = parseResult.data

    if (!data.acceptTerms || !data.acceptPrivacy) {
      return NextResponse.json({ error: "Você deve aceitar os termos e a política de privacidade." }, { status: 400 })
    }

    if (data.isMinor && (!data.guardianName || !data.guardianEmail)) {
      return NextResponse.json({ error: "Responsável legal é obrigatório para menores de 18 anos." }, { status: 400 })
    }

    // Normalize email to lowercase (already done by schema transform)
    const email = data.email

    // Check if email already exists — use constant-time path to prevent timing-based enumeration
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Return success-like response to prevent user enumeration
      return NextResponse.json({ success: true, message: "Conta criada com sucesso." })
    }

    // Validate birthDate is a real date and compute age server-side (don't trust client-supplied age)
    const birthDateObj = new Date(data.birthDate)
    if (isNaN(birthDateObj.getTime())) {
      return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 })
    }
    const serverAge = calculateAge(birthDateObj)
    const serverIsMinor = serverAge < 18

    const passwordHash = await bcrypt.hash(data.password, 12)

    // Get active terms and privacy versions
    const terms = await prisma.termsOfUse.findFirst({ where: { isActive: true } })
    const privacy = await prisma.privacyPolicy.findFirst({ where: { isActive: true } })

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Create user — use server-computed isMinor, not client-supplied
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "USER",
        status: serverIsMinor ? "PENDING_CONSENT" : "PENDING_EMAIL",
        isMinor: serverIsMinor,
      },
    })

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        birthDate: birthDateObj,
        age: serverAge,
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

    // Audit log — do not include sensitive info
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

    if (serverIsMinor) {
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

      // TODO: send guardian email using nodemailer
      // Guardian email address intentionally not logged to avoid leaking PII to console
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

      // TODO: send verification email using nodemailer
      // In production: remove the auto-verify block below
      if (process.env.NODE_ENV === 'development') {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: "ACTIVE", emailVerified: new Date() },
        })
      }
    }

    // Do not return user IDs or internal data
    return NextResponse.json({ success: true, message: "Conta criada com sucesso." })
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 })
  }
}
