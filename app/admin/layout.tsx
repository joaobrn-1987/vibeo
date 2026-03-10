import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { AdminSidebarProvider } from "@/components/admin/sidebar-context"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "MASTER_ADMIN") redirect("/dashboard")

  return (
    <AdminSidebarProvider>
      <div className="min-h-screen bg-cream-100">
        <AdminSidebar user={session.user} />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <AdminHeader user={session.user} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminSidebarProvider>
  )
}
