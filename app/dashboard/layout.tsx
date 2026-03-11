import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  const aiSetting = await prisma.systemSetting.findUnique({ where: { key: "AI_ENABLED" } })
  const aiEnabled = aiSetting?.value === "true"

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-cream-100" data-theme={session.user.theme}>
        <DashboardSidebar user={session.user} aiEnabled={aiEnabled} />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <DashboardHeader user={session.user} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
