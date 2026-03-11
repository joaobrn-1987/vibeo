import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  url: z.string().url().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  type: z.enum(["emergency", "professional", "community", "self_care"]),
  targetRisk: z.array(z.enum(["STABLE", "ATTENTION", "HIGH_RISK", "IMMEDIATE_PRIORITY"])),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const resources = await prisma.supportResource.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] })
  return NextResponse.json({ resources })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const parse = schema.safeParse(body)
  if (!parse.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  const { url, ...rest } = parse.data
  const resource = await prisma.supportResource.create({
    data: { ...rest, url: url || null },
  })

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: "CREATE_RESOURCE",
      resource: "SupportResource",
      resourceId: resource.id,
      details: { title: resource.title },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ resource }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 })

  const resource = await prisma.supportResource.update({ where: { id }, data })

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: "UPDATE_RESOURCE",
      resource: "SupportResource",
      resourceId: id,
      details: data,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ resource })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 })

  await prisma.supportResource.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      createdBy: session.user.id,
      action: "DELETE_RESOURCE",
      resource: "SupportResource",
      resourceId: id,
      details: {},
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  })

  return NextResponse.json({ success: true })
}
