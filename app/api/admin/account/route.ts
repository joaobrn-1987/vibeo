import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emailSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  // Change email
  if (action === "email" || !action) {
    const emailToParse = body.email
    const parse = emailSchema.safeParse(emailToParse)
    if (!parse.success) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })
    const newEmail = parse.data
    const existing = await prisma.user.findUnique({ where: { email: newEmail } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 })
    }
    await prisma.user.update({ where: { id: session.user.id }, data: { email: newEmail, emailVerified: new Date() } })
    await prisma.auditLog.create({ data: { createdBy: session.user.id, action: "UPDATE_MASTER_EMAIL", resource: "User", resourceId: session.user.id, ipAddress: req.headers.get("x-forwarded-for") || "unknown" } })
    return NextResponse.json({ success: true, message: "E-mail atualizado. Faça login novamente." })
  }

  // Change name
  if (action === "name") {
    const { fullName } = body
    if (!fullName || fullName.trim().length < 2) return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres." }, { status: 400 })
    await prisma.profile.updateMany({ where: { userId: session.user.id }, data: { fullName: fullName.trim() } })
    await prisma.auditLog.create({ data: { createdBy: session.user.id, action: "UPDATE_MASTER_NAME", resource: "User", resourceId: session.user.id, details: { fullName }, ipAddress: req.headers.get("x-forwarded-for") || "unknown" } })
    return NextResponse.json({ success: true })
  }

  // Change password
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
    await prisma.auditLog.create({ data: { createdBy: session.user.id, action: "UPDATE_MASTER_PASSWORD", resource: "User", resourceId: session.user.id, ipAddress: req.headers.get("x-forwarded-for") || "unknown" } })
    return NextResponse.json({ success: true, message: "Senha alterada com sucesso." })
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 })
}
