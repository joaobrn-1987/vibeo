"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import {
  Settings, Mail, Lock, ToggleLeft, ToggleRight, Save, AlertTriangle,
  Check, Eye, EyeOff, ArrowLeft, Zap, TestTube, Loader2, ExternalLink, Info, Trash2, Globe
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília / São Paulo (UTC-3)" },
  { value: "America/Manaus", label: "Manaus (UTC-4)" },
  { value: "America/Belem", label: "Belém (UTC-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (UTC-3)" },
  { value: "America/Recife", label: "Recife (UTC-3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC-5)" },
  { value: "UTC", label: "UTC (GMT+0)" },
]

const ANTHROPIC_MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 – Rápido e econômico (recomendado)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 – Balanceado" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 – Mais poderoso" },
]

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite – Rápido e gratuito (recomendado)" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash – Mais capaz, gratuito" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite – Gratuito" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash – Gratuito (cota limitada)" },
]

const ALL_MODEL_LABELS: Record<string, string> = Object.fromEntries(
  [...ANTHROPIC_MODELS, ...GEMINI_MODELS].map((m) => [m.value, m.label])
)

interface Props {
  currentEmail: string
  currentName: string
  registrationsBlocked: boolean
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  aiEnabled: boolean
  aiApiKey: string
  aiModel: string
  aiProvider: string
  timezone: string
}

export function ConfiguracoesClient({
  currentEmail,
  currentName,
  registrationsBlocked: initialBlocked,
  smtpHost: initialHost,
  smtpPort: initialPort,
  smtpUser: initialUser,
  smtpPass: initialPass,
  smtpFrom: initialFrom,
  aiEnabled: initialAiEnabled,
  aiApiKey: initialApiKey,
  aiModel: initialModel,
  aiProvider: initialProvider,
  timezone: initialTimezone,
}: Props) {
  const router = useRouter()

  // Registration block
  const [blocked, setBlocked] = useState(initialBlocked)
  const [blockSaving, setBlockSaving] = useState(false)

  // Master name
  const [newName, setNewName] = useState(currentName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Master email
  const [newEmail, setNewEmail] = useState(currentEmail)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Master password
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // SMTP
  const [smtp, setSmtp] = useState({ host: initialHost, port: initialPort, user: initialUser, pass: initialPass, from: initialFrom })
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpMsg, setSmtpMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Timezone
  const [timezone, setTimezone] = useState(initialTimezone)
  const [timezoneSaving, setTimezoneSaving] = useState(false)
  const [timezoneMsg, setTimezoneMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // AI Integration
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled)
  const [aiApiKey, setAiApiKey] = useState(initialApiKey)
  const [aiModel, setAiModel] = useState(initialModel || "claude-haiku-4-5-20251001")
  const [aiProvider, setAiProvider] = useState(initialProvider || "anthropic")
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiMsg, setAiMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; actualModel?: string } | null>(null)
  const [listingModels, setListingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[] | null>(null)
  const [listModelsError, setListModelsError] = useState<string | null>(null)

  async function saveTimezone() {
    setTimezoneSaving(true); setTimezoneMsg(null)
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "TIMEZONE", value: timezone }),
    })
    if (res.ok) {
      setTimezoneMsg({ ok: true, text: "Fuso horário salvo com sucesso!" })
      router.refresh()
    } else {
      setTimezoneMsg({ ok: false, text: "Erro ao salvar fuso horário." })
    }
    setTimezoneSaving(false)
  }

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
    if (ok) { setBlocked(newVal); router.refresh() }
    setBlockSaving(false)
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault(); setNameSaving(true); setNameMsg(null)
    const res = await fetch("/api/admin/account", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "name", fullName: newName }),
    })
    if (res.ok) { setNameMsg({ ok: true, text: "Nome atualizado com sucesso!" }) }
    else { const d = await res.json(); setNameMsg({ ok: false, text: d.error || "Erro ao salvar." }) }
    setNameSaving(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: "As senhas não conferem." }); return }
    if (pwForm.next.length < 8) { setPwMsg({ ok: false, text: "Mínimo 8 caracteres." }); return }
    setPwSaving(true); setPwMsg(null)
    const res = await fetch("/api/admin/account", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password", currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    const data = await res.json()
    if (res.ok) { setPwMsg({ ok: true, text: "Senha alterada com sucesso!" }); setPwForm({ current: "", next: "", confirm: "" }) }
    else { setPwMsg({ ok: false, text: data.error || "Erro ao alterar senha." }) }
    setPwSaving(false)
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault(); setEmailSaving(true); setEmailMsg(null)
    const res = await fetch("/api/admin/account", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
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
    e.preventDefault(); setSmtpSaving(true); setSmtpMsg(null)
    try {
      await Promise.all([
        saveSetting("SMTP_HOST", smtp.host), saveSetting("SMTP_PORT", smtp.port),
        saveSetting("SMTP_USER", smtp.user), saveSetting("SMTP_PASS", smtp.pass),
        saveSetting("SMTP_FROM", smtp.from),
      ])
      setSmtpMsg({ ok: true, text: "Configurações SMTP salvas com sucesso." })
      router.refresh()
    } catch { setSmtpMsg({ ok: false, text: "Erro ao salvar configurações SMTP." }) }
    setSmtpSaving(false)
  }

  async function clearAI() {
    if (!confirm("Limpar todas as configurações de integração de IA? A chave e o modelo serão removidos.")) return
    setAiApiKey(""); setAiModel("gemini-2.5-flash-lite"); setAiProvider("gemini"); setAiEnabled(false); setTestResult(null); setAiMsg(null); setAvailableModels(null)
    await fetch("/api/admin/ia-integracao", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          { key: "AI_ENABLED", value: "false" },
          { key: "AI_API_KEY", value: "" },
          { key: "AI_MODEL", value: "" },
          { key: "AI_PROVIDER", value: "anthropic" },
        ],
      }),
    })
    setAiMsg({ ok: true, text: "Configurações de IA limpas." })
    router.refresh()
  }

  async function saveAI() {
    setAiSaving(true); setAiMsg(null)
    const res = await fetch("/api/admin/ia-integracao", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          { key: "AI_ENABLED", value: String(aiEnabled) },
          { key: "AI_API_KEY", value: aiApiKey },
          { key: "AI_MODEL", value: aiModel },
          { key: "AI_PROVIDER", value: aiProvider },
        ],
      }),
    })
    if (res.ok) {
      setAiMsg({ ok: true, text: "Integração de IA salva com sucesso!" })
      router.refresh()
    } else {
      setAiMsg({ ok: false, text: "Erro ao salvar." })
    }
    setAiSaving(false)
  }

  async function listModels() {
    if (!aiApiKey.trim()) { setListModelsError("Insira a chave de API primeiro."); return }
    setListingModels(true); setAvailableModels(null); setListModelsError(null)
    const res = await fetch("/api/admin/ia-integracao", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list_models", apiKey: aiApiKey, provider: aiProvider }),
    })
    const data = await res.json()
    if (!res.ok || data.error) { setListModelsError(data.error || "Erro ao listar modelos.") }
    else { setAvailableModels(data.models || []) }
    setListingModels(false)
  }

  async function testAI() {
    if (!aiApiKey.trim()) { setTestResult({ success: false, message: "Insira a chave de API antes de testar." }); return }
    setTesting(true); setTestResult(null)
    const res = await fetch("/api/admin/ia-integracao", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", apiKey: aiApiKey, model: aiModel, provider: aiProvider }),
    })
    const data = await res.json()
    setTestResult(data)
    setTesting(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao painel
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Configurações do sistema</h1>
              <p className="text-sm text-foreground/50">Apenas o Master Admin pode acessar esta seção.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Block Toggle */}
      <Card className={blocked ? "border-red-200 bg-red-50/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {blocked ? <ToggleRight className="w-5 h-5 text-red-500" /> : <ToggleLeft className="w-5 h-5 text-foreground/40" />}
            Bloquear novos cadastros
            {blocked && <span className="ml-auto text-xs font-normal text-red-600 bg-red-100 px-2 py-0.5 rounded-full">ATIVO</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground/60 mb-5">
            {blocked
              ? "⚠️ O sistema está fechado para novos cadastros. Nenhum novo usuário conseguirá se registrar até que esta opção seja desativada."
              : "Quando ativado, nenhum novo usuário conseguirá se registrar. Usuários existentes continuam acessando normalmente."}
          </p>
          <button onClick={toggleBlock} disabled={blockSaving}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${blocked ? "bg-red-500 hover:bg-red-600 text-white" : "bg-cream-100 hover:bg-cream-200 text-foreground border border-cream-200"} disabled:opacity-60 disabled:cursor-not-allowed`}>
            {blocked ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {blockSaving ? "Salvando..." : blocked ? "Desativar bloqueio" : "Ativar bloqueio de cadastros"}
          </button>
        </CardContent>
      </Card>

      {/* ===== AI INTEGRATION ===== */}
      <Card className={aiEnabled ? "border-purple-200 bg-purple-50/20" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className={`w-5 h-5 ${aiEnabled ? "text-purple-500" : "text-foreground/40"}`} />
            Integração de IA
            {aiEnabled && <span className="ml-auto text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">ATIVA</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
            <div>
              <p className="text-sm font-medium text-foreground">Ativar assistente Vibe (IA)</p>
              <p className="text-xs text-foreground/50 mt-0.5">A IA responderá aos usuários usando as regras de Conteúdo › Configurações de IA</p>
            </div>
            <button onClick={() => setAiEnabled(!aiEnabled)}>
              {aiEnabled
                ? <ToggleRight className="w-9 h-9 text-purple-500 cursor-pointer" />
                : <ToggleLeft className="w-9 h-9 text-foreground/30 cursor-pointer" />}
            </button>
          </div>

          {/* Provider */}
          <div>
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-2 block">Provedor</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: "gemini", label: "Google Gemini", sub: "Gratuito · aistudio.google.com", free: true, defaultModel: "gemini-2.5-flash-lite" },
                { value: "openai", label: "OpenAI", sub: "GPT · pago", free: false, defaultModel: "gpt-4o-mini" },
              ].map((p) => (
                <button key={p.value} onClick={() => { setAiProvider(p.value); setAiModel(p.defaultModel); setAvailableModels(null) }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${aiProvider === p.value ? "border-purple-400 bg-purple-50" : "border-cream-200 hover:border-purple-200"}`}>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{p.label}</span>
                    {p.free && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">grátis</span>}
                  </div>
                  <p className="text-xs text-foreground/50 mt-0.5">{p.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">
              {aiProvider === "gemini" ? "Google AI Studio API Key" : "OpenAI API Key"}
            </label>
            <div className="relative">
              <input type={showApiKey ? "text" : "password"} value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder={aiProvider === "gemini" ? "AIza..." : "sk-..."}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300" />
              <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Info className="w-3 h-3 text-foreground/40 flex-shrink-0" />
              <p className="text-xs text-foreground/40">
                Armazenada com segurança no banco de dados.
                {aiProvider === "gemini" && (
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                    className="ml-1 text-purple-500 hover:underline inline-flex items-center gap-0.5">
                    Obter chave grátis <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-2 block">Modelo</label>
            {aiProvider === "gemini" ? (
              <div className="space-y-2">
                {GEMINI_MODELS.map((m) => (
                  <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${aiModel === m.value ? "border-purple-300 bg-purple-50" : "border-cream-200 hover:border-purple-200"}`}>
                    <input type="radio" name="aiModel" value={m.value} checked={aiModel === m.value} onChange={() => setAiModel(m.value)} className="accent-purple-500" />
                    <span className="text-sm text-foreground">{m.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input type="text" value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="gpt-4o-mini"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300" />
            )}
          </div>

          {/* Test connection */}
          <div className="pt-1 border-t border-cream-100">
            <Button variant="outline" onClick={testAI} disabled={testing || !aiApiKey.trim()} size="sm">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              {testing ? "Testando conexão..." : "Testar conexão"}
            </Button>
            {testResult && (
              <div className={`mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm border ${testResult.success ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {testResult.success ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <div>
                  <p>{testResult.message}</p>
                  {testResult.success && testResult.actualModel && (
                    <p className="text-xs mt-1 opacity-75">
                      Modelo em uso: <strong>{ALL_MODEL_LABELS[testResult.actualModel] || testResult.actualModel}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {aiMsg && (
            <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${aiMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {aiMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {aiMsg.text}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={saveAI} disabled={aiSaving}>
              {aiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {aiSaving ? "Salvando..." : "Salvar integração de IA"}
            </Button>
            <Button variant="outline" onClick={clearAI} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
              <Trash2 className="w-4 h-4" />
              Limpar configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Admin — Name + Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-5 h-5 text-primary-500" />
            Conta Master Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-6">
          {/* Name */}
          <form onSubmit={saveName} className="space-y-3">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Nome</p>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} minLength={2} required
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            {nameMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${nameMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {nameMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {nameMsg.text}
              </p>
            )}
            <Button type="submit" disabled={nameSaving || newName.trim() === currentName} size="sm">
              <Save className="w-4 h-4" />
              {nameSaving ? "Salvando..." : "Salvar nome"}
            </Button>
          </form>

          <div className="border-t border-cream-100" />

          {/* Password */}
          <form onSubmit={savePassword} className="space-y-3">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Alterar senha</p>
            <div>
              <label className="text-xs text-foreground/50 mb-1 block">Senha atual</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Nova senha</label>
                <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} minLength={8} required
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs text-foreground/50 mb-1 block">Confirmar</label>
                <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
            <p className="text-xs text-foreground/40">Mínimo 8 caracteres</p>
            {pwMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${pwMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {pwMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {pwMsg.text}
              </p>
            )}
            <Button type="submit" disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm} size="sm">
              <Lock className="w-4 h-4" />
              {pwSaving ? "Alterando..." : "Alterar senha"}
            </Button>
          </form>
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
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Novo e-mail</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" required />
            </div>
            {emailMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${emailMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
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

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-5 h-5 text-primary-500" />
            Fuso horário
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-foreground/60">
            Define o fuso horário usado para exibição de datas e horários em todo o sistema.
          </p>
          <div>
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Fuso horário do sistema</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          {timezoneMsg && (
            <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${timezoneMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {timezoneMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {timezoneMsg.text}
            </p>
          )}
          <Button onClick={saveTimezone} disabled={timezoneSaving} size="sm">
            <Save className="w-4 h-4" />
            {timezoneSaving ? "Salvando..." : "Salvar fuso horário"}
          </Button>
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
                <input type="text" placeholder="smtp.gmail.com" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Porta</label>
                <input type="number" placeholder="587" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Usuário</label>
                <input type="email" placeholder="seu@email.com" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Senha / App Password</label>
                <div className="relative">
                  <input type={showSmtpPass ? "text" : "password"} placeholder="••••••••••••" value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                  <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                    {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Remetente (From)</label>
              <input type="text" placeholder="Vibeo <noreply@vibeo.com.br>" value={smtp.from}
                onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            {smtpMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 ${smtpMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {smtpMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {smtpMsg.text}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={smtpSaving}>
                <Save className="w-4 h-4" />
                {smtpSaving ? "Salvando..." : "Salvar configurações SMTP"}
              </Button>
              <p className="text-xs text-foreground/40">Para Gmail: use uma App Password de 16 dígitos</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
