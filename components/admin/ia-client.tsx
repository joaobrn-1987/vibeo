"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Save, Loader2, Brain, X, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Config {
  id: string; key: string; value: string; description: string | null; isActive: boolean
}

const DEFAULT_CONFIGS = [
  { key: "SYSTEM_PROMPT", description: "Prompt do sistema para a IA", value: "Você é Vibe, uma assistente virtual acolhedora e empática do Vibeo, uma plataforma de bem-estar emocional para jovens." },
  { key: "MAX_TOKENS", description: "Número máximo de tokens por resposta", value: "1024" },
  { key: "TEMPERATURE", description: "Temperatura da IA (0.0 - 1.0)", value: "0.7" },
  { key: "RISK_DETECTION_ENABLED", description: "Habilitar detecção de risco nas conversas", value: "true" },
  { key: "CRISIS_RESPONSE_PROMPT", description: "Prompt adicional para situações de crise", value: "Em situações de crise, sempre mencione o CVV (188) e o SAMU (192)." },
]

export function IAClient({ configs: initial }: { configs: Config[] }) {
  const router = useRouter()
  const [configs, setConfigs] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newConfig, setNewConfig] = useState({ key: "", value: "", description: "" })
  const [addSaving, setAddSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave(key: string) {
    setSaving(key)
    const res = await fetch("/api/admin/ia", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: editValue }),
    })
    if (res.ok) {
      setConfigs((prev) => prev.map((c) => c.key === key ? { ...c, value: editValue } : c))
      setEditing(null)
      router.refresh()
    }
    setSaving(null)
  }

  async function handleAdd() {
    if (!newConfig.key.trim() || !newConfig.value.trim()) { setError("Chave e valor obrigatórios."); return }
    setAddSaving(true); setError("")
    const res = await fetch("/api/admin/ia", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    })
    const data = await res.json()
    if (res.ok) {
      const existing = configs.find((c) => c.key === newConfig.key)
      if (existing) {
        setConfigs((prev) => prev.map((c) => c.key === newConfig.key ? { ...c, value: newConfig.value } : c))
      } else {
        setConfigs((prev) => [...prev, data.config])
      }
      setShowAddForm(false)
      setNewConfig({ key: "", value: "", description: "" })
      router.refresh()
    } else {
      setError(data.error || "Erro ao salvar.")
    }
    setAddSaving(false)
  }

  async function addDefault(cfg: typeof DEFAULT_CONFIGS[0]) {
    const res = await fetch("/api/admin/ia", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    })
    const data = await res.json()
    if (res.ok) {
      const existing = configs.find((c) => c.key === cfg.key)
      if (existing) {
        setConfigs((prev) => prev.map((c) => c.key === cfg.key ? { ...c, value: cfg.value } : c))
      } else {
        setConfigs((prev) => [...prev, data.config])
      }
      router.refresh()
    }
  }

  const missingDefaults = DEFAULT_CONFIGS.filter((d) => !configs.find((c) => c.key === d.key))

  return (
    <div className="space-y-6">
      {missingDefaults.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-blue-700 mb-3">Configurações padrão sugeridas</p>
            <div className="space-y-2">
              {missingDefaults.map((cfg) => (
                <div key={cfg.key} className="flex items-center justify-between gap-3 bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-semibold text-foreground">{cfg.key}</p>
                    <p className="text-xs text-foreground/50">{cfg.description}</p>
                  </div>
                  <button onClick={() => addDefault(cfg)} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0">
                    + Adicionar
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => { setShowAddForm(true); setError("") }} size="sm">
          <Plus className="w-4 h-4" />
          Nova configuração
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Nova configuração</span>
              <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4" /></button>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Chave</label>
                <input type="text" placeholder="MINHA_CONFIG" value={newConfig.key}
                  onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                  className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Descrição</label>
                <input type="text" value={newConfig.description} onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Valor</label>
              <textarea value={newConfig.value} onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })} rows={3}
                className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={addSaving}>
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {addSaving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {configs.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="p-12 text-center text-foreground/40">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma configuração de IA cadastrada.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {configs.map((cfg) => (
          <Card key={cfg.id}>
            <CardContent className="p-4">
              {editing === cfg.key ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-foreground">{cfg.key}</span>
                    <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
                  </div>
                  <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300 resize-y" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(cfg.key)} disabled={saving === cfg.key}>
                      {saving === cfg.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving === cfg.key ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{cfg.key}</span>
                    </div>
                    {cfg.description && <p className="text-xs text-foreground/50 mt-0.5">{cfg.description}</p>}
                    <div className="mt-2 bg-cream-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-mono text-foreground/70 whitespace-pre-wrap break-all">{cfg.value}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditing(cfg.key); setEditValue(cfg.value) }}
                    className="p-2 rounded-lg hover:bg-cream-100 transition-colors flex-shrink-0"
                  >
                    <Pencil className="w-4 h-4 text-foreground/50" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
