import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileClient } from "@/components/dashboard/profile-client"

export const metadata = { title: "Perfil" }

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  })

  if (!user) redirect("/login")

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName || "",
        birthDate: user.profile?.birthDate?.toISOString().split("T")[0] || "",
        theme: user.profile?.theme || "FEMININE",
        totalCheckIns: user.profile?.totalCheckIns || 0,
        streakDays: user.profile?.streakDays || 0,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  )
}
