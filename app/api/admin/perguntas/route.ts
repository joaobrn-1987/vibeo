import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }
  const categories = await prisma.emotionalCategory.findMany({
    orderBy: { order: "asc" },
    include: { questions: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const { resourceType, ...data } = body

  if (resourceType === "category") {
    if (!data.name || !data.slug) return NextResponse.json({ error: "name e slug obrigatórios." }, { status: 400 })
    const cat = await prisma.emotionalCategory.create({ data: { name: data.name, slug: data.slug, description: data.description, icon: data.icon, color: data.color, order: data.order || 0 } })
    return NextResponse.json({ category: cat }, { status: 201 })
  }

  if (resourceType === "question") {
    if (!data.categoryId || !data.text || !data.shortLabel || !data.type) {
      return NextResponse.json({ error: "categoryId, text, shortLabel e type obrigatórios." }, { status: 400 })
    }
    const q = await prisma.emotionalQuestion.create({
      data: {
        categoryId: data.categoryId, text: data.text, shortLabel: data.shortLabel,
        type: data.type, weight: data.weight || 1.0, order: data.order || 0,
        isActive: data.isActive !== false, minAge: data.minAge || null, maxAge: data.maxAge || null,
      },
    })
    return NextResponse.json({ question: q }, { status: 201 })
  }

  return NextResponse.json({ error: "resourceType inválido." }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { resourceType, id, ...data } = await req.json()
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 })

  if (resourceType === "category") {
    const cat = await prisma.emotionalCategory.update({ where: { id }, data })
    return NextResponse.json({ category: cat })
  }

  if (resourceType === "question") {
    const q = await prisma.emotionalQuestion.update({ where: { id }, data })
    return NextResponse.json({ question: q })
  }

  return NextResponse.json({ error: "resourceType inválido." }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const resourceType = searchParams.get("type")
  if (!id || !resourceType) return NextResponse.json({ error: "id e type obrigatórios." }, { status: 400 })

  if (resourceType === "category") {
    await prisma.emotionalCategory.delete({ where: { id } })
  } else if (resourceType === "question") {
    await prisma.emotionalQuestion.delete({ where: { id } })
  }

  return NextResponse.json({ success: true })
}
