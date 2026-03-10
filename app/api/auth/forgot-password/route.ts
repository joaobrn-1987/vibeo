import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (user && !user.deletedAt) {
      const token = generateToken(48)
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        },
      })
      // TODO: send email with reset link
      console.log(`Password reset link: ${process.env.NEXT_PUBLIC_APP_URL}/nova-senha/${token}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
