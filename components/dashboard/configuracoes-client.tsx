"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Bell, Lock, Check, AlertTriangle, Eye, EyeOff, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  notificationsEnabled: boolean
  emailNotifications: boolean
}

export function ConfiguracoesUserClient({ notificationsEnabled: initNotif, emailNotifications: initEmail }: Props) {
  const router = useRouter()

  // Notifications
  const [notif, setNotif] = useState(initNotif)
  const [emailNotif, setEmailNotif] = useState(initEmail)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMsg, setNotifMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" })
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function saveNotifications() {
    setNotifSaving(true); setNotifMsg(null)
    const res = await fetch("/api/user/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "profile", notificationsEnabled: notif, emailNotifications: emailNotif }),
    })
    if (res.ok) {
      setNotifMsg({ ok: true, text: "Preferências salvas com sucesso!" })
      router.refresh()
    } else {
      setNotifMsg({ ok: false, text: "Erro ao salvar." })
    }
    setNotifSaving(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg({ ok: false, text: "As senhas não conferem." }); return }
    if (pwForm.newPassword.length < 8) { setPwMsg({ ok: false, text: "A nova senha deve ter pelo menos 8 caracteres." }); return }
    setPwSaving(true); setPwMsg(null)
    const res = await fetch("/api/user/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password", currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setPwMsg({ ok: true, text: "Senha alterada com sucesso!" })
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" })
    } else {
      setPwMsg({ ok: false, text: data.error || "Erro ao alterar senha." })
    }
    setPwSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Configurações</h1>
          <p className="text-sm text-foreground/50">Personalize sua experiência no Vibeo</p>
        </div>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-primary-500" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-3">
            {[
              { label: "Lembretes de check-in", desc: "Receba lembretes para fazer seu check-in diário", value: notif, onChange: setNotif },
              { label: "Notificações por e-mail", desc: "Receba atualizações e relatórios no seu e-mail", value: emailNotif, onChange: setEmailNotif },
            ].map((item) => (
              <label key={item.label} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only" checked={item.value} onChange={(e) => item.onChange(e.target.checked)} />
                  <div onClick={() => item.onChange(!item.value)}
                    className={`w-10 h-5.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${item.value ? "bg-primary-500" : "bg-cream-300"}`}
                    style={{ height: "22px" }}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-[3px] ml-[3px] ${item.value ? "translate-x-[18px]" : ""}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-foreground/50">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {notifMsg && (
            <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${notifMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {notifMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {notifMsg.text}
            </p>
          )}

          <Button onClick={saveNotifications} disabled={notifSaving} size="sm">
            {notifSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {notifSaving ? "Salvando..." : "Salvar preferências"}
          </Button>
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
        <CardContent className="pt-0">
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Senha atual</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  required
                />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Nova senha</label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-foreground/40 mt-1">Mínimo 8 caracteres</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Confirmar nova senha</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                required
              />
            </div>

            {pwMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${pwMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {pwMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {pwMsg.text}
              </p>
            )}

            <Button type="submit" disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm} size="sm">
              {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {pwSaving ? "Alterando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
