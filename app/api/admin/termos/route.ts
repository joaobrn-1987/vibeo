import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const [terms, privacyPolicies] = await Promise.all([
    prisma.termsOfUse.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.privacyPolicy.findMany({ orderBy: { createdAt: "desc" } }),
  ])
  return NextResponse.json({ terms, privacyPolicies })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { docType, version, content, summary } = await req.json()
  if (!docType || !version || !content) {
    return NextResponse.json({ error: "Campos obrigatórios: docType, version, content." }, { status: 400 })
  }

  let doc
  if (docType === "terms") {
    doc = await prisma.termsOfUse.create({ data: { version, content, summary, isActive: false } })
  } else {
    doc = await prisma.privacyPolicy.create({ data: { version, content, summary, isActive: false } })
  }

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: docType === "terms" ? "CREATE_TERMS" : "CREATE_PRIVACY",
      resource: docType === "terms" ? "TermsOfUse" : "PrivacyPolicy",
      resourceId: doc.id,
      details: { version },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ doc }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { id, docType, action } = await req.json()
  if (!id || !docType || action !== "activate") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  if (docType === "terms") {
    await prisma.termsOfUse.updateMany({ where: { isActive: true }, data: { isActive: false } })
    await prisma.termsOfUse.update({ where: { id }, data: { isActive: true, publishedAt: new Date() } })
  } else {
    await prisma.privacyPolicy.updateMany({ where: { isActive: true }, data: { isActive: false } })
    await prisma.privacyPolicy.update({ where: { id }, data: { isActive: true, publishedAt: new Date() } })
  }

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: docType === "terms" ? "ACTIVATE_TERMS" : "ACTIVATE_PRIVACY",
      resource: docType === "terms" ? "TermsOfUse" : "PrivacyPolicy",
      resourceId: id,
      details: { action },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ success: true })
}
