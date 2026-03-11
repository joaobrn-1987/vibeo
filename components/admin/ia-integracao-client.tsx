"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Zap, Save, Loader2, Check, AlertTriangle, Eye, EyeOff,
  ToggleLeft, ToggleRight, TestTube, Info, ExternalLink
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ANTHROPIC_MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 – Rápido e econômico (recomendado)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 – Balanceado" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 – Mais poderoso" },
]

interface Props {
  enabled: boolean
  apiKey: string
  model: string
  provider: string
}

export function IAIntegracaoClient({ enabled: initEnabled, apiKey: initKey, model: initModel, provider: initProvider }: Props) {
  const router = useRouter()

  const [enabled, setEnabled] = useState(initEnabled)
  const [apiKey, setApiKey] = useState(initKey)
  const [model, setModel] = useState(initModel || "claude-haiku-4-5-20251001")
  const [provider, setProvider] = useState(initProvider || "anthropic")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSave() {
    setSaving(true); setSaveMsg(null)
    const res = await fetch("/api/admin/ia-integracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          { key: "AI_ENABLED", value: String(enabled) },
          { key: "AI_API_KEY", value: apiKey },
          { key: "AI_MODEL", value: model },
          { key: "AI_PROVIDER", value: provider },
        ],
      }),
    })
    if (res.ok) {
      setSaveMsg({ ok: true, text: "Configurações salvas com sucesso!" })
      router.refresh()
    } else {
      setSaveMsg({ ok: false, text: "Erro ao salvar." })
    }
    setSaving(false)
  }

  async function handleTest() {
    if (!apiKey.trim()) { setTestResult({ success: false, message: "Insira a chave de API antes de testar." }); return }
    setTesting(true); setTestResult(null)
    const res = await fetch("/api/admin/ia-integracao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", apiKey, model }),
    })
    const data = await res.json()
    setTestResult(data)
    setTesting(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Enable/disable toggle */}
      <Card className={enabled ? "border-green-200 bg-green-50/20" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Ativar integração de IA</p>
              <p className="text-sm text-foreground/50 mt-0.5">
                Quando ativa, a assistente Vibe responde aos usuários usando a API configurada abaixo.
              </p>
            </div>
            <button onClick={() => setEnabled(!enabled)} className="flex-shrink-0">
              {enabled
                ? <ToggleRight className="w-10 h-10 text-green-500 cursor-pointer" />
                : <ToggleLeft className="w-10 h-10 text-foreground/30 cursor-pointer" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-500" />
            Provedor de IA
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[{ value: "anthropic", label: "Anthropic (Claude)", recommended: true }, { value: "openai", label: "OpenAI (GPT)", recommended: false }].map((p) => (
              <button
                key={p.value}
                onClick={() => setProvider(p.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${provider === p.value ? "border-primary-400 bg-primary-50" : "border-cream-200 hover:border-primary-200"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{p.label}</span>
                  {p.recommended && <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">Recomendado</span>}
                </div>
                {provider === p.value && <Check className="w-4 h-4 text-primary-500 mt-1" />}
              </button>
            ))}
          </div>

          {provider === "openai" && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>O suporte a OpenAI está disponível mas o sistema foi otimizado para Anthropic Claude.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chave de API</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">
              {provider === "anthropic" ? "Anthropic API Key" : "OpenAI API Key"}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === "anthropic" ? "sk-ant-api03-..." : "sk-..."}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-cream-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button type="button" onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Info className="w-3 h-3 text-foreground/40 flex-shrink-0" />
              <p className="text-xs text-foreground/40">
                A chave é armazenada criptograficamente no banco de dados e nunca é exibida completa.
                {provider === "anthropic" && (
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                    className="ml-1 text-primary-500 hover:underline inline-flex items-center gap-0.5">
                    Obter chave <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
            </div>
          </div>

          {/* Model selection */}
          <div>
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1.5 block">Modelo</label>
            {provider === "anthropic" ? (
              <div className="space-y-2">
                {ANTHROPIC_MODELS.map((m) => (
                  <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${model === m.value ? "border-primary-300 bg-primary-50" : "border-cream-200 hover:border-primary-200"}`}>
                    <input type="radio" name="model" value={m.value} checked={model === m.value} onChange={() => setModel(m.value)} className="text-primary-500" />
                    <span className="text-sm text-foreground">{m.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            )}
          </div>

          {/* Test connection */}
          <div className="pt-2 border-t border-cream-100">
            <Button variant="outline" onClick={handleTest} disabled={testing || !apiKey.trim()}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
            {testResult && (
              <div className={`mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm border ${testResult.success ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {testResult.success ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                {testResult.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      {saveMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${saveMsg.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {saveMsg.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {saveMsg.text}
        </div>
      )}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  )
}
