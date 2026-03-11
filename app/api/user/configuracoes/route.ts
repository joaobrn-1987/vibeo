import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const profileSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === "profile") {
    const parse = profileSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: parse.data,
    })
    return NextResponse.json({ success: true })
  }

  if (action === "password") {
    const parse = passwordSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

    const valid = await bcrypt.compare(parse.data.currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 })

    const hash = await bcrypt.hash(parse.data.newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 })
}
