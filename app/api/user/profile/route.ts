import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""

  // Handle avatar upload (multipart)
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const file = formData.get("avatar") as File | null
    if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 })
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Apenas imagens são permitidas." }, { status: 400 })
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Imagem deve ter no máximo 2MB." }, { status: 400 })

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg"
    const filename = `${session.user.id}.${ext}`
    const bytes = await file.arrayBuffer()
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars")
    await writeFile(join(uploadDir, filename), Buffer.from(bytes))
    const avatarUrl = `/uploads/avatars/${filename}`

    await prisma.profile.update({ where: { userId: session.user.id }, data: { avatarUrl } })
    return NextResponse.json({ success: true, avatarUrl })
  }

  // Handle JSON actions
  const body = await req.json()
  const { action } = body

  if (action === "profile") {
    const { fullName, socialName, notificationsEnabled, emailNotifications } = body
    const data: Record<string, any> = {}
    if (fullName && fullName.trim().length >= 2) data.fullName = fullName.trim()
    if (socialName !== undefined) data.socialName = socialName ? socialName.trim() : null
    if (notificationsEnabled !== undefined) data.notificationsEnabled = notificationsEnabled
    if (emailNotifications !== undefined) data.emailNotifications = emailNotifications
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nenhum dado para atualizar." }, { status: 400 })
    await prisma.profile.update({ where: { userId: session.user.id }, data })
    return NextResponse.json({ success: true })
  }

  if (action === "password") {
    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Senha inválida. Mínimo 8 caracteres." }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 })
    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } })
    return NextResponse.json({ success: true })
  }

  if (action === "remove_avatar") {
    await prisma.profile.update({ where: { userId: session.user.id }, data: { avatarUrl: null } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 })
}
