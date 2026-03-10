"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Settings, Mail, Lock, ToggleLeft, ToggleRight, Save, AlertTriangle, Check, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  currentEmail: string
  registrationsBlocked: boolean
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpFrom: string
}

export function ConfiguracoesClient({
  currentEmail,
  registrationsBlocked: initialBlocked,
  smtpHost: initialHost,
  smtpPort: initialPort,
  smtpUser: initialUser,
  smtpPass: initialPass,
  smtpFrom: initialFrom,
}: Props) {
  const router = useRouter()

  // Registration block
  const [blocked, setBlocked] = useState(initialBlocked)
  const [blockSaving, setBlockSaving] = useState(false)

  // Master email
  const [newEmail, setNewEmail] = useState(currentEmail)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // SMTP
  const [smtp, setSmtp] = useState({
    host: initialHost,
    port: initialPort,
    user: initialUser,
    pass: initialPass,
    from: initialFrom,
  })
  const [showPass, setShowPass] = useState(false)
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpMsg, setSmtpMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function saveSetting(key: string, value: string) {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    return res.ok
  }

  async function toggleBlock() {
    setBlockSaving(true)
    const newVal = !blocked
    const ok = await saveSetting("REGISTRATIONS_BLOCKED", String(newVal))
    if (ok) {
      setBlocked(newVal)
      router.refresh()
    }
    setBlockSaving(false)
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailSaving(true)
    setEmailMsg(null)
    const res = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    })
    const data = await res.json()
    if (res.ok) {
      setEmailMsg({ ok: true, text: "E-mail atualizado! Faça login novamente." })
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2000)
    } else {
      setEmailMsg({ ok: false, text: data.error || "Erro ao salvar." })
    }
    setEmailSaving(false)
  }

  async function saveSmtp(e: React.FormEvent) {
    e.preventDefault()
    setSmtpSaving(true)
    setSmtpMsg(null)
    try {
      await Promise.all([
        saveSetting("SMTP_HOST", smtp.host),
        saveSetting("SMTP_PORT", smtp.port),
        saveSetting("SMTP_USER", smtp.user),
        saveSetting("SMTP_PASS", smtp.pass),
        saveSetting("SMTP_FROM", smtp.from),
      ])
      setSmtpMsg({ ok: true, text: "Configurações SMTP salvas com sucesso." })
      router.refresh()
    } catch {
      setSmtpMsg({ ok: false, text: "Erro ao salvar configurações SMTP." })
    }
    setSmtpSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Configurações do sistema</h1>
          <p className="text-sm text-foreground/50">Apenas o Master Admin pode acessar esta seção.</p>
        </div>
      </div>

      {/* Registration Block Toggle */}
      <Card className={blocked ? "border-red-200 bg-red-50/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {blocked
              ? <ToggleRight className="w-5 h-5 text-red-500" />
              : <ToggleLeft className="w-5 h-5 text-foreground/40" />}
            Bloquear novos cadastros
            {blocked && (
              <span className="ml-auto text-xs font-normal text-red-600 bg-red-100 px-2 py-0.5 rounded-full">ATIVO</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground/60 mb-5">
            {blocked
              ? "⚠️ O sistema está fechado para novos cadastros. Nenhum novo usuário conseguirá se registrar até que esta opção seja desativada."
              : "Quando ativado, nenhum novo usuário conseguirá se registrar. Usuários existentes continuam acessando normalmente."}
          </p>
          <button
            onClick={toggleBlock}
            disabled={blockSaving}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
              blocked
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-cream-100 hover:bg-cream-200 text-foreground border border-cream-200"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {blocked
              ? <ToggleRight className="w-5 h-5" />
              : <ToggleLeft className="w-5 h-5" />}
            {blockSaving ? "Salvando..." : blocked ? "Desativar bloqueio" : "Ativar bloqueio de cadastros"}
          </button>
        </CardContent>
      </Card>

      {/* Master Admin Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-primary-500" />
            E-mail da conta Master Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground/60 mb-4">
            Ao alterar, você será deslogado automaticamente e precisará entrar com o novo e-mail.
          </p>
          <form onSubmit={saveEmail} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">
                Novo e-mail
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                required
              />
            </div>
            {emailMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${
                emailMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {emailMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {emailMsg.text}
              </p>
            )}
            <Button type="submit" disabled={emailSaving || newEmail === currentEmail} size="sm">
              <Save className="w-4 h-4" />
              {emailSaving ? "Salvando..." : "Salvar novo e-mail"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-5 h-5 text-primary-500" />
            Configuração de e-mail (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground/60 mb-4">
            Necessário para envio de recuperação de senha, verificação de e-mail e consentimento de responsáveis.
          </p>
          <form onSubmit={saveSmtp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Servidor SMTP</label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtp.host}
                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Porta</label>
                <input
                  type="number"
                  placeholder="587"
                  value={smtp.port}
                  onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Usuário</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={smtp.user}
                  onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Senha / App Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">
                Remetente (From)
              </label>
              <input
                type="text"
                placeholder="Vibeo &lt;noreply@vibeo.com.br&gt;"
                value={smtp.from}
                onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            {smtpMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${
                smtpMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {smtpMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {smtpMsg.text}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={smtpSaving}>
                <Save className="w-4 h-4" />
                {smtpSaving ? "Salvando..." : "Salvar configurações SMTP"}
              </Button>
              <p className="text-xs text-foreground/40">
                Para Gmail: use uma App Password de 16 dígitos
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
