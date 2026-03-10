import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { forgotPasswordSchema } from "@/lib/validations"

// In-memory rate limiting for password reset requests
// Structure: email -> { count: number, windowStart: number }
const resetAttempts = new Map<string, { count: number; windowStart: number }>()
const MAX_RESETS = 3
const RESET_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isResetRateLimited(email: string): boolean {
  const now = Date.now()
  const record = resetAttempts.get(email)
  if (!record) return false
  if (now - record.windowStart > RESET_WINDOW_MS) {
    resetAttempts.delete(email)
    return false
  }
  return record.count >= MAX_RESETS
}

function recordResetAttempt(email: string): void {
  const now = Date.now()
  const record = resetAttempts.get(email)
  if (!record || now - record.windowStart > RESET_WINDOW_MS) {
    resetAttempts.set(email, { count: 1, windowStart: now })
  } else {
    record.count += 1
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parseResult = forgotPasswordSchema.safeParse(body)

    if (!parseResult.success) {
      // Always return success to prevent email enumeration
      return NextResponse.json({ success: true })
    }

    const { email } = parseResult.data

    // Rate limit check — still return success to prevent enumeration
    if (isResetRateLimited(email)) {
      return NextResponse.json({ success: true })
    }

    recordResetAttempt(email)

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success regardless of whether email exists (anti-enumeration)
    if (user && !user.deletedAt) {
      // Use cryptographically random token
      const token = crypto.randomBytes(48).toString('hex')

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        },
      })

      // TODO: send email with reset link using nodemailer
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    // Return success even on error to avoid leaking information
    return NextResponse.json({ success: true })
  }
}
