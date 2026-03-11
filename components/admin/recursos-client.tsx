"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, Save, Loader2, Heart, Phone, Globe, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TYPE_LABELS: Record<string, string> = {
  emergency: "Emergência",
  professional: "Profissional",
  community: "Comunidade",
  self_care: "Autocuidado",
}
const TYPE_COLORS: Record<string, string> = {
  emergency: "bg-red-100 text-red-700",
  professional: "bg-blue-100 text-blue-700",
  community: "bg-green-100 text-green-700",
  self_care: "bg-purple-100 text-purple-700",
}
const RISK_LABELS: Record<string, string> = {
  STABLE: "Estável", ATTENTION: "Atenção", HIGH_RISK: "Alto risco", IMMEDIATE_PRIORITY: "Prioridade imediata",
}

interface Resource {
  id: string; title: string; description: string | null; url: string | null; phone: string | null
  type: string; targetRisk: string[]; isActive: boolean; order: number; createdAt: string
}

const EMPTY_FORM = {
  title: "", description: "", url: "", phone: "",
  type: "professional" as string,
  targetRisk: [] as string[],
  isActive: true, order: 0,
}

export function RecursosClient({ resources: initial }: { resources: Resource[] }) {
  const router = useRouter()
  const [resources, setResources] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError("")
    setShowForm(true)
  }

  function openEdit(r: Resource) {
    setEditing(r)
    setForm({ title: r.title, description: r.description || "", url: r.url || "", phone: r.phone || "", type: r.type, targetRisk: r.targetRisk, isActive: r.isActive, order: r.order })
    setError("")
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Título obrigatório."); return }
    setSaving(true); setError("")
    const body = editing ? { id: editing.id, ...form } : form
    const res = await fetch("/api/admin/recursos", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || "Erro ao salvar."); setSaving(false); return }
    setShowForm(false)
    router.refresh()
    // Optimistically update
    if (editing) {
      setResources((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...form } : r))
    } else {
      setResources((prev) => [data.resource, ...prev])
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este recurso?")) return
    setDeleting(id)
    await fetch(`/api/admin/recursos?id=${id}`, { method: "DELETE" })
    setResources((prev) => prev.filter((r) => r.id !== id))
    router.refresh()
    setDeleting(null)
  }

  async function toggleActive(r: Resource) {
    const res = await fetch("/api/admin/recursos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
    })
    if (res.ok) setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, isActive: !r.isActive } : x))
  }

  function toggleRisk(level: string) {
    setForm((f) => ({
      ...f,
      targetRisk: f.targetRisk.includes(level) ? f.targetRisk.filter((r) => r !== level) : [...f.targetRisk, level],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Novo recurso
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{editing ? "Editar recurso" : "Novo recurso"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Telefone</label>
                  <input type="text" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">URL</label>
                  <input type="url" placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Mostrar para níveis de risco</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(RISK_LABELS).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => toggleRisk(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${form.targetRisk.includes(v) ? "bg-primary-500 text-white border-primary-500" : "bg-white text-foreground/60 border-cream-200 hover:border-primary-300"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                <span className="text-xs text-foreground/50">Ordem de exibição</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {resources.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-foreground/40">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum recurso cadastrado ainda.</p>
            <p className="text-xs mt-1">Clique em "Novo recurso" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <Card key={r.id} className={r.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{r.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type] || "bg-gray-100 text-gray-700"}`}>
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                      {!r.isActive && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inativo</span>}
                    </div>
                    {r.description && <p className="text-sm text-foreground/60 mt-1">{r.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-foreground/50">
                      {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>}
                      {r.url && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{r.url}</span>}
                    </div>
                    {r.targetRisk.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <span className="text-xs text-foreground/40">Para:</span>
                        {r.targetRisk.map((risk) => (
                          <span key={risk} className="text-xs px-1.5 py-0.5 bg-cream-100 rounded">{RISK_LABELS[risk] || risk}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(r)} className="p-2 rounded-lg hover:bg-cream-100 transition-colors" title={r.isActive ? "Desativar" : "Ativar"}>
                      {r.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-foreground/30" />}
                    </button>
                    <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-cream-100 transition-colors">
                      <Pencil className="w-4 h-4 text-foreground/50" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4 text-red-400" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
