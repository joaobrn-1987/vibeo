"use client"
import { useState } from "react"
import { User, Mail, Calendar, Palette, Shield, LogOut, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { formatDate } from "@/lib/utils"
import { signOut } from "next-auth/react"

const themes = [
  { value: "FEMININE", label: "Feminino", emoji: "🌸", gradient: "from-accent-400 to-accent-600" },
  { value: "MASCULINE", label: "Masculino", emoji: "🌊", gradient: "from-primary-500 to-primary-700" },
  { value: "DIVERSITY", label: "Diversidade", emoji: "🌈", gradient: "from-purple-500 to-teal-500" },
]

interface ProfileClientProps {
  user: {
    id: string
    email: string
    fullName: string
    birthDate: string
    theme: string
    totalCheckIns: number
    streakDays: number
    createdAt: string
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [selectedTheme, setSelectedTheme] = useState(user.theme)
  const [notifications, setNotifications] = useState(true)
  const [saving, setSaving] = useState(false)

  async function handleThemeChange(theme: string) {
    setSelectedTheme(theme)
    setSaving(true)
    try {
      await fetch("/api/user/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Meu perfil</h1>
        <p className="text-sm text-foreground/50 mt-1">Gerencie suas informações e preferências.</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-2xl">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-xl text-foreground">{user.fullName}</h2>
              <p className="text-sm text-foreground/50">{user.email}</p>
              <div className="flex gap-2 mt-1.5">
                <Badge variant="default">{user.totalCheckIns} check-ins</Badge>
                <Badge variant="muted">🔥 {user.streakDays} dias seguidos</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: <User className="w-4 h-4" />, label: "Nome", value: user.fullName },
              { icon: <Mail className="w-4 h-4" />, label: "E-mail", value: user.email },
              { icon: <Calendar className="w-4 h-4" />, label: "Membro desde", value: formatDate(user.createdAt) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
                <div className="text-foreground/40">{item.icon}</div>
                <div>
                  <p className="text-xs text-foreground/40">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5 text-primary-500" />
            Tema visual
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-foreground/50 mb-4">Escolha o tema que mais combina com você.</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => handleThemeChange(theme.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
                  selectedTheme === theme.value
                    ? "border-primary-400 bg-primary-50 shadow-soft"
                    : "border-cream-200 bg-white hover:border-primary-200"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl`}>
                  {theme.emoji}
                </div>
                <span className="text-xs font-semibold text-foreground">{theme.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-primary-500" />
            Privacidade e dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Notificações de check-in</p>
              <p className="text-xs text-foreground/40">Lembretes diários para cuidar de você</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full">
              Exportar meus dados
            </Button>
            <Button variant="destructive" size="sm" className="w-full opacity-70">
              <Trash2 className="w-4 h-4" />
              Solicitar exclusão de conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-red-200 text-red-500 hover:bg-red-50"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>
    </div>
  )
}
