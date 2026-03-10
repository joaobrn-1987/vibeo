import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import { UsersTable } from "@/components/admin/users-table"
import { RegistrationToggle } from "@/components/admin/registration-toggle"

export const metadata = { title: "Usuários – Admin" }

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const isMasterAdmin = session.user.role === "MASTER_ADMIN"

  const [users, blockSetting] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    isMasterAdmin
      ? prisma.systemSetting.findUnique({ where: { key: "REGISTRATIONS_BLOCKED" } })
      : null,
  ])

  const registrationsBlocked = blockSetting?.value === "true"

  const serialized = users.map((u) => ({
    id: u.id,
    email: u.email,
    status: u.status,
    role: u.role,
    isMinor: u.isMinor,
    createdAt: u.createdAt.toISOString(),
    profile: u.profile
      ? {
          fullName: u.profile.fullName,
          currentRiskLevel: u.profile.currentRiskLevel,
          totalCheckIns: u.profile.totalCheckIns,
        }
      : null,
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Usuários</h1>
            <p className="text-sm text-foreground/50">{users.length} usuários cadastrados</p>
          </div>
        </div>

        {isMasterAdmin && (
          <RegistrationToggle blocked={registrationsBlocked} />
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <UsersTable
            users={serialized}
            isMasterAdmin={isMasterAdmin}
            currentUserId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
