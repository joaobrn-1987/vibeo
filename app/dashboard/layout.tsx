import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.role === "ADMIN" || session.user.role === "MASTER_ADMIN") {
    redirect("/admin")
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-cream-100" data-theme={session.user.theme}>
        <DashboardSidebar user={session.user} />
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
