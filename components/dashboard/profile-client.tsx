"use client"
import { useState, useRef } from "react"
import { User, Mail, Calendar, Palette, Shield, LogOut, Trash2, Check, Camera, X, Bell, Lock, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"

const themes = [
  {
    value: "FEMININE",
    label: "Feminino",
    emoji: "🌸",
    style: { background: "linear-gradient(135deg, #C4717A, #e8a0a7)" },
  },
  {
    value: "MASCULINE",
    label: "Masculino",
    emoji: "🌊",
    style: { background: "#1B3A5C" },
  },
  {
    value: "DIVERSITY",
    label: "LGBT+",
    emoji: "🏳️‍🌈",
    style: {
      background: "linear-gradient(135deg, #E40303 0%, #FF8C00 20%, #FFED00 40%, #008026 60%, #004DFF 80%, #750787 100%)",
    },
  },
]

interface ProfileClientProps {
  user: {
    id: string
    email: string
    fullName: string
    socialName: string
    birthDate: string
    theme: string
    totalCheckIns: number
    streakDays: number
    createdAt: string
    avatarUrl: string | null
    notificationsEnabled: boolean
    emailNotifications: boolean
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [selectedTheme, setSelectedTheme] = useState(user.theme)
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)
  const { update } = useSession()

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Personal info edit
  const [editingInfo, setEditingInfo] = useState(false)
  const [fullName, setFullName] = useState(user.fullName)
  const [socialName, setSocialName] = useState(user.socialName)
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(user.notificationsEnabled)
  const [emailNotif, setEmailNotif] = useState(user.emailNotifications)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMsg, setNotifMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // ─── Theme ────────────────────────────────────────────────────────────────
  async function handleThemeChange(theme: string) {
    setSelectedTheme(theme)
    setThemeSaving(true)
    try {
      const res = await fetch("/api/user/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      })
      if (res.ok) {
        await update({ theme })
        const themeEl = document.querySelector("[data-theme]")
        if (themeEl) themeEl.setAttribute("data-theme", theme)
        setThemeSaved(true)
        setTimeout(() => setThemeSaved(false), 2500)
      }
    } finally {
      setThemeSaving(false)
    }
  }

  // ─── Avatar ───────────────────────────────────────────────────────────────
  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setAvatarMsg({ type: "err", text: "Apenas imagens são permitidas." })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: "err", text: "Imagem deve ter no máximo 2MB." })
      return
    }
    setAvatarFile(file)
    setAvatarMsg(null)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return
    setAvatarSaving(true)
    setAvatarMsg(null)
    try {
      const fd = new FormData()
      fd.append("avatar", avatarFile)
      const res = await fetch("/api/user/profile", { method: "PATCH", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setAvatarMsg({ type: "err", text: data.error || "Erro ao salvar foto." })
      } else {
        setAvatarUrl(data.avatarUrl)
        setAvatarPreview(null)
        setAvatarFile(null)
        setAvatarMsg({ type: "ok", text: "Foto atualizada!" })
        await update({ image: data.avatarUrl })
        setTimeout(() => setAvatarMsg(null), 3000)
      }
    } finally {
      setAvatarSaving(false)
    }
  }

  async function handleAvatarRemove() {
    setAvatarSaving(true)
    setAvatarMsg(null)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_avatar" }),
      })
      if (res.ok) {
        setAvatarUrl(null)
        setAvatarPreview(null)
        setAvatarFile(null)
        setAvatarMsg({ type: "ok", text: "Foto removida." })
        setTimeout(() => setAvatarMsg(null), 3000)
      }
    } finally {
      setAvatarSaving(false)
    }
  }

  // ─── Personal info ────────────────────────────────────────────────────────
  async function handleInfoSave() {
    setInfoSaving(true)
    setInfoMsg(null)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", fullName, socialName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInfoMsg({ type: "err", text: data.error || "Erro ao salvar." })
      } else {
        setInfoMsg({ type: "ok", text: "Informações salvas!" })
        setEditingInfo(false)
        await update({ name: (socialName?.trim() || fullName).trim() })
        setTimeout(() => setInfoMsg(null), 3000)
      }
    } finally {
      setInfoSaving(false)
    }
  }

  // ─── Password ─────────────────────────────────────────────────────────────
  async function handlePasswordSave() {
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "As senhas não coincidem." })
      return
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "A nova senha deve ter pelo menos 8 caracteres." })
      return
    }
    setPwSaving(true)
    setPwMsg(null)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwMsg({ type: "err", text: data.error || "Erro ao alterar senha." })
      } else {
        setPwMsg({ type: "ok", text: "Senha alterada com sucesso!" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPwMsg(null), 3000)
      }
    } finally {
      setPwSaving(false)
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────
  async function saveNotifications(notificationsEnabled: boolean, emailNotifications: boolean) {
    setNotifSaving(true)
    setNotifMsg(null)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", notificationsEnabled, emailNotifications }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNotifMsg({ type: "err", text: data.error || "Erro ao salvar." })
      } else {
        setNotifMsg({ type: "ok", text: "Preferências salvas!" })
        setTimeout(() => setNotifMsg(null), 2500)
      }
    } finally {
      setNotifSaving(false)
    }
  }

  const displayName = socialName?.trim() || fullName

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Meu perfil</h1>
        <p className="text-sm text-foreground/50 mt-1">Gerencie suas informações e preferências.</p>
      </div>

      {/* Avatar + identity card */}
      <Card>
        <CardContent className="p-6">
          {/* Avatar row */}
          <div className="flex items-start gap-5 mb-6">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-3xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white shadow-sm transition-colors"
                title="Alterar foto"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl text-foreground truncate">{displayName}</h2>
              {socialName?.trim() && fullName && (
                <p className="text-xs text-foreground/40 truncate">{fullName}</p>
              )}
              <p className="text-sm text-foreground/50 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <Badge variant="default">{user.totalCheckIns} check-ins</Badge>
                <Badge variant="muted">🔥 {user.streakDays} dias seguidos</Badge>
              </div>
            </div>
          </div>

          {/* Avatar actions */}
          {(avatarPreview || avatarFile) && (
            <div className="flex gap-2 mb-4">
              <Button size="sm" onClick={handleAvatarUpload} disabled={avatarSaving}>
                {avatarSaving ? "Salvando..." : "Salvar foto"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setAvatarPreview(null); setAvatarFile(null) }}
                disabled={avatarSaving}
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          )}
          {!avatarPreview && avatarUrl && (
            <div className="mb-4">
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleAvatarRemove}
                disabled={avatarSaving}
              >
                <Trash2 className="w-4 h-4" /> Remover foto
              </Button>
            </div>
          )}
          {avatarMsg && (
            <p className={`text-xs mb-4 ${avatarMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {avatarMsg.text}
            </p>
          )}

          {/* Info fields */}
          {!editingInfo ? (
            <div className="space-y-3">
              {[
                { icon: <User className="w-4 h-4" />, label: "Nome", value: fullName },
                ...(socialName?.trim() ? [{ icon: <User className="w-4 h-4" />, label: "Nome social", value: socialName }] : []),
                { icon: <Mail className="w-4 h-4" />, label: "E-mail", value: user.email },
                { icon: <Calendar className="w-4 h-4" />, label: "Membro desde", value: formatDate(user.createdAt) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
                  <div className="text-foreground/40">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/40">{item.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditingInfo(true)}>
                <Pencil className="w-3.5 h-3.5" /> Editar informações
              </Button>
              {infoMsg && (
                <p className={`text-xs ${infoMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {infoMsg.text}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">Nome completo</label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="socialName" className="text-sm font-medium text-foreground">Nome social <span className="text-foreground/40 text-xs font-normal">(opcional)</span></label>
                <Input
                  id="socialName"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  placeholder="Como prefere ser chamado(a)"
                  className="mt-1"
                />
                <p className="text-xs text-foreground/40 mt-1">Se preenchido, será exibido no lugar do nome completo.</p>
              </div>
              {infoMsg && (
                <p className={`text-xs ${infoMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {infoMsg.text}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInfoSave} disabled={infoSaving}>
                  {infoSaving ? "Salvando..." : <><Check className="w-4 h-4" /> Salvar</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingInfo(false); setFullName(user.fullName); setSocialName(user.socialName) }} disabled={infoSaving}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5 text-primary-500" />
            Tema visual
            {themeSaved && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-normal">
                <Check className="w-3.5 h-3.5" /> Tema salvo!
              </span>
            )}
            {themeSaving && (
              <span className="ml-auto text-xs text-foreground/40 font-normal">Salvando...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-foreground/50 mb-4">Escolha o tema que mais combina com você. A mudança é aplicada imediatamente.</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => handleThemeChange(theme.value)}
                disabled={themeSaving}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 ${
                  selectedTheme === theme.value
                    ? "border-primary-400 bg-primary-50 shadow-soft"
                    : "border-cream-200 bg-white hover:border-primary-200"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={theme.style}>
                  {theme.emoji}
                </div>
                <span className="text-xs font-semibold text-foreground">{theme.label}</span>
                {selectedTheme === theme.value && (
                  <span className="text-[10px] text-primary-500 font-semibold">Ativo</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-primary-500" />
            Notificações
            {notifMsg && (
              <span className={`ml-auto text-xs font-normal ${notifMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {notifMsg.text}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-3">
          <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Notificações de check-in</p>
              <p className="text-xs text-foreground/40">Lembretes diários para cuidar de você</p>
            </div>
            <Switch
              checked={notifEnabled}
              onCheckedChange={(v) => {
                setNotifEnabled(v)
                saveNotifications(v, emailNotif)
              }}
              disabled={notifSaving}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Notificações por e-mail</p>
              <p className="text-xs text-foreground/40">Receba avisos importantes no seu e-mail</p>
            </div>
            <Switch
              checked={emailNotif}
              onCheckedChange={(v) => {
                setEmailNotif(v)
                saveNotifications(notifEnabled, v)
              }}
              disabled={notifSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-5 h-5 text-primary-500" />
            Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div>
            <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">Senha atual</label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground">Nova senha</label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirmar nova senha</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="mt-1"
            />
          </div>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {pwMsg.text}
            </p>
          )}
          <Button
            size="sm"
            onClick={handlePasswordSave}
            disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
          >
            {pwSaving ? "Salvando..." : "Alterar senha"}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-primary-500" />
            Privacidade e dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            Exportar meus dados
          </Button>
          <Button variant="destructive" size="sm" className="w-full opacity-70">
            <Trash2 className="w-4 h-4" />
            Solicitar exclusão de conta
          </Button>
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
