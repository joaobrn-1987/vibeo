import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { theme } = await req.json()
    if (!["FEMININE", "MASCULINE", "DIVERSITY"].includes(theme)) {
      return NextResponse.json({ error: "Tema inválido." }, { status: 400 })
    }

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { theme },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
