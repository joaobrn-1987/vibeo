"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Shield, Plus, CheckCircle, X, Save, Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Doc {
  id: string; version: string; content: string; summary: string | null
  isActive: boolean; publishedAt: string | null; createdAt: string
}

interface Props {
  terms: Doc[]
  privacyPolicies: Doc[]
}

function DocSection({ title, icon: Icon, docs, docType }: { title: string; icon: any; docs: Doc[]; docType: string }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ version: "", content: "", summary: "" })
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function handleCreate() {
    if (!form.version.trim() || !form.content.trim()) { setError("Versão e conteúdo são obrigatórios."); return }
    setSaving(true); setError("")
    const res = await fetch("/api/admin/termos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType, ...form }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || "Erro ao salvar."); setSaving(false); return }
    setShowForm(false)
    setForm({ version: "", content: "", summary: "" })
    router.refresh()
    setSaving(false)
  }

  async function handleActivate(id: string) {
    setActivating(id)
    await fetch("/api/admin/termos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, docType, action: "activate" }),
    })
    router.refresh()
    setActivating(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="w-5 h-5 text-primary-500" />
            {title}
          </CardTitle>
          <Button size="sm" onClick={() => { setShowForm(true); setError("") }}>
            <Plus className="w-4 h-4" />
            Nova versão
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {showForm && (
          <div className="border border-cream-200 rounded-xl p-4 space-y-3 bg-cream-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Nova versão</span>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Versão *</label>
              <input type="text" placeholder="1.0.0" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Resumo</label>
              <input type="text" placeholder="Breve descrição das mudanças" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Conteúdo *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} placeholder="Conteúdo completo do documento..."
                className="w-full px-3 py-2.5 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-y font-mono" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Salvando..." : "Criar versão"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {docs.length === 0 && !showForm && (
          <p className="text-sm text-foreground/40 text-center py-6">Nenhuma versão cadastrada.</p>
        )}

        {docs.map((doc) => (
          <div key={doc.id} className={`border rounded-xl overflow-hidden ${doc.isActive ? "border-green-200 bg-green-50/30" : "border-cream-200"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">v{doc.version}</span>
                  {doc.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />Ativa
                    </span>
                  )}
                  <span className="text-xs text-foreground/40">
                    Criada em {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    {doc.publishedAt && ` · Publicada em ${new Date(doc.publishedAt).toLocaleDateString("pt-BR")}`}
                  </span>
                </div>
                {doc.summary && <p className="text-xs text-foreground/60 mt-0.5">{doc.summary}</p>}
              </div>
              <div className="flex items-center gap-2">
                {!doc.isActive && (
                  <button
                    onClick={() => handleActivate(doc.id)}
                    disabled={activating === doc.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
                  >
                    {activating === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Ativar
                  </button>
                )}
                <button
                  onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                  className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors"
                >
                  {expanded === doc.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {expanded === doc.id && (
              <div className="px-4 pb-4 border-t border-cream-100">
                <pre className="text-xs text-foreground/70 whitespace-pre-wrap font-sans mt-3 max-h-60 overflow-y-auto bg-white p-3 rounded-lg border border-cream-200">
                  {doc.content}
                </pre>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function TermosClient({ terms, privacyPolicies }: Props) {
  return (
    <div className="space-y-6">
      <DocSection title="Termos de uso" icon={FileText} docs={terms} docType="terms" />
      <DocSection title="Política de privacidade" icon={Shield} docs={privacyPolicies} docType="privacy" />
    </div>
  )
}
