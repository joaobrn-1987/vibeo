import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DashboardHome } from "@/components/dashboard/dashboard-home"

export const metadata = { title: "Início" }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [user, aiSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        checkIns: {
          orderBy: { createdAt: "desc" },
          take: 7,
        },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: "AI_ENABLED" } }),
  ])

  if (!user) redirect("/login")

  const aiEnabled = aiSetting?.value === "true"

  // Get recent check-ins data
  const recentCheckIns = user.checkIns
  const lastCheckIn = recentCheckIns[0] || null
  const todayCheckedIn = lastCheckIn &&
    new Date(lastCheckIn.createdAt).toDateString() === new Date().toDateString()

  // Calculate weekly mood average
  const weekCheckIns = recentCheckIns.slice(0, 7)
  const avgMood = weekCheckIns.length > 0
    ? Math.round(weekCheckIns.reduce((s, c) => s + (c.overallMood || 5), 0) / weekCheckIns.length)
    : null

  const chartData = weekCheckIns.reverse().map((c) => ({
    day: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][new Date(c.createdAt).getDay()],
    humor: c.overallMood || 5,
    energia: c.energyLevel || 5,
    sono: c.sleepQuality || 5,
  }))

  const userData = {
    name: user.profile?.fullName?.split(" ")[0] || "você",
    fullName: user.profile?.fullName || "",
    theme: user.profile?.theme || "FEMININE",
    riskLevel: user.profile?.currentRiskLevel || "STABLE",
    streakDays: user.profile?.streakDays || 0,
    totalCheckIns: user.profile?.totalCheckIns || 0,
    avgMood,
    todayCheckedIn,
    chartData,
    lastCheckIn: lastCheckIn ? {
      mood: lastCheckIn.overallMood,
      dominantFeeling: lastCheckIn.dominantFeeling,
      createdAt: lastCheckIn.createdAt.toISOString(),
    } : null,
  }

  return <DashboardHome user={userData} aiEnabled={aiEnabled} />
}
