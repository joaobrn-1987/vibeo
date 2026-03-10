import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isValidCuid } from "@/lib/validations"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Re-verify session and role on every request — do not rely solely on middleware
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { id } = params

  // Validate that the target ID has a valid cuid format before querying the DB
  if (!id || !isValidCuid(id)) {
    return NextResponse.json({ error: "ID de usuário inválido." }, { status: 400 })
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "Não é possível excluir sua própria conta." }, { status: 400 })
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
  }

  if (target.role === "MASTER_ADMIN") {
    return NextResponse.json({ error: "Não é possível excluir outro Master Admin." }, { status: 400 })
  }

  try {
    // Delete in dependency order (children first, then parent)
    await prisma.emotionalAnswer.deleteMany({
      where: { checkIn: { userId: id } },
    })
    await prisma.emotionalCheckIn.deleteMany({ where: { userId: id } })
    await prisma.emotionalScore.deleteMany({ where: { profile: { userId: id } } })
    await prisma.emotionalAlert.deleteMany({ where: { profile: { userId: id } } })
    await prisma.aISession.deleteMany({ where: { userId: id } })
    await prisma.aIMemory.deleteMany({ where: { userId: id } })
    await prisma.consentLog.deleteMany({ where: { userId: id } })
    await prisma.dataExportRequest.deleteMany({ where: { userId: id } })
    await prisma.guardianConsent.deleteMany({ where: { minorUserId: id } })
    await prisma.guardianConsent.deleteMany({ where: { guardianUserId: id } })
    await prisma.verificationToken.deleteMany({ where: { userId: id } })
    await prisma.passwordReset.deleteMany({ where: { userId: id } })
    await prisma.session.deleteMany({ where: { userId: id } })
    await prisma.account.deleteMany({ where: { userId: id } })
    await prisma.profile.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })

    // Audit log with IP address
    await prisma.auditLog.create({
      data: {
        createdBy: session.user.id,
        action: "DELETE_USER",
        resource: "User",
        resourceId: id,
        details: { deletedRole: target.role },
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário." }, { status: 500 })
  }
}
