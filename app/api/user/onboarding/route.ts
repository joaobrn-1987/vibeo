import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  theme: z.enum(["FEMININE", "MASCULINE", "DIVERSITY"]),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const body = await req.json()
  const parse = schema.safeParse(body)
  if (!parse.success) return NextResponse.json({ error: "Tema inválido." }, { status: 400 })

  await prisma.profile.update({
    where: { userId: session.user.id },
    data: { theme: parse.data.theme, onboardingCompleted: true },
  })

  return NextResponse.json({ success: true })
}
