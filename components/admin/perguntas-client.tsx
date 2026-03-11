"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, Pencil, Trash2, X, Save, Loader2, MessageSquare,
  ChevronDown, ChevronRight, ToggleLeft, ToggleRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Question {
  id: string; categoryId: string; text: string; shortLabel: string
  type: string; weight: number; order: number; isActive: boolean
  minAge: number | null; maxAge: number | null
}

interface Category {
  id: string; name: string; slug: string; description: string | null
  icon: string | null; color: string | null; order: number; isActive: boolean
  questions: Question[]
}

const QUESTION_TYPES = [
  { value: "scale", label: "Escala (1-10)" },
  { value: "emoji", label: "Emoji" },
  { value: "boolean", label: "Sim/Não" },
  { value: "text", label: "Texto livre" },
]

const EMPTY_Q = { text: "", shortLabel: "", type: "scale", weight: 1.0, order: 0, isActive: true, minAge: "", maxAge: "" }
const EMPTY_CAT = { name: "", slug: "", description: "", icon: "", color: "#4A6FA5", order: 0 }

export function PerguntasClient({ categories: initial }: { categories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState(EMPTY_CAT)
  const [catSaving, setCatSaving] = useState(false)
  const [showQForm, setShowQForm] = useState<string | null>(null) // categoryId
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [qForm, setQForm] = useState(EMPTY_Q)
  const [qSaving, setQSaving] = useState(false)
  const [error, setError] = useState("")

  async function saveCategory() {
    if (!catForm.name.trim() || !catForm.slug.trim()) { setError("Nome e slug obrigatórios."); return }
    setCatSaving(true); setError("")
    const body = editingCat
      ? { resourceType: "category", id: editingCat.id, ...catForm }
      : { resourceType: "category", ...catForm }
    const res = await fetch("/api/admin/perguntas", {
      method: editingCat ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowCatForm(false)
      setEditingCat(null)
      setCatForm(EMPTY_CAT)
      router.refresh()
      const data = await res.json()
      if (editingCat) {
        setCategories((prev) => prev.map((c) => c.id === editingCat.id ? { ...c, ...catForm } : c))
      } else {
        setCategories((prev) => [...prev, { ...data.category, questions: [] }])
      }
    } else {
      const d = await res.json(); setError(d.error || "Erro ao salvar.")
    }
    setCatSaving(false)
  }

  async function deleteCategory(id: string) {
    if (!confirm("Excluir esta categoria e todas as suas perguntas?")) return
    await fetch(`/api/admin/perguntas?id=${id}&type=category`, { method: "DELETE" })
    setCategories((prev) => prev.filter((c) => c.id !== id))
    router.refresh()
  }

  async function saveQuestion(categoryId: string) {
    if (!qForm.text.trim() || !qForm.shortLabel.trim()) { setError("Texto e rótulo obrigatórios."); return }
    setQSaving(true); setError("")
    const body = editingQ
      ? { resourceType: "question", id: editingQ.id, ...qForm, minAge: qForm.minAge ? parseInt(String(qForm.minAge)) : null, maxAge: qForm.maxAge ? parseInt(String(qForm.maxAge)) : null }
      : { resourceType: "question", categoryId, ...qForm, minAge: qForm.minAge ? parseInt(String(qForm.minAge)) : null, maxAge: qForm.maxAge ? parseInt(String(qForm.maxAge)) : null }
    const res = await fetch("/api/admin/perguntas", {
      method: editingQ ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setShowQForm(null); setEditingQ(null); setQForm(EMPTY_Q)
      router.refresh()
      if (editingQ) {
        setCategories((prev) => prev.map((c) => ({
          ...c,
          questions: c.questions.map((q) => q.id === editingQ.id ? { ...q, ...qForm } : q),
        })))
      } else {
        setCategories((prev) => prev.map((c) => c.id === categoryId ? { ...c, questions: [...c.questions, data.question] } : c))
      }
    } else {
      const d = await res.json(); setError(d.error || "Erro ao salvar.")
    }
    setQSaving(false)
  }

  async function deleteQuestion(questionId: string, categoryId: string) {
    if (!confirm("Excluir esta pergunta?")) return
    await fetch(`/api/admin/perguntas?id=${questionId}&type=question`, { method: "DELETE" })
    setCategories((prev) => prev.map((c) => c.id === categoryId ? { ...c, questions: c.questions.filter((q) => q.id !== questionId) } : c))
    router.refresh()
  }

  async function toggleQuestion(q: Question) {
    await fetch("/api/admin/perguntas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "question", id: q.id, isActive: !q.isActive }),
    })
    setCategories((prev) => prev.map((c) => ({
      ...c,
      questions: c.questions.map((x) => x.id === q.id ? { ...x, isActive: !q.isActive } : x),
    })))
  }

  function openEditCat(cat: Category) {
    setEditingCat(cat)
    setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || "", icon: cat.icon || "", color: cat.color || "#4A6FA5", order: cat.order })
    setError("")
    setShowCatForm(true)
  }

  function openAddQuestion(categoryId: string) {
    setEditingQ(null)
    setQForm(EMPTY_Q)
    setError("")
    setShowQForm(categoryId)
  }

  function openEditQuestion(q: Question) {
    setEditingQ(q)
    setQForm({ text: q.text, shortLabel: q.shortLabel, type: q.type, weight: q.weight, order: q.order, isActive: q.isActive, minAge: q.minAge !== null ? String(q.minAge) : "", maxAge: q.maxAge !== null ? String(q.maxAge) : "" })
    setError("")
    setShowQForm(q.categoryId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingCat(null); setCatForm(EMPTY_CAT); setError(""); setShowCatForm(true) }}>
          <Plus className="w-4 h-4" />
          Nova categoria
        </Button>
      </div>

      {/* Category form modal */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{editingCat ? "Editar categoria" : "Nova categoria"}</h2>
              <button onClick={() => setShowCatForm(false)}><X className="w-5 h-5" /></button>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Nome *</label>
                  <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Slug *</label>
                  <input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })}
                    className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Descrição</label>
                <input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Ícone</label>
                  <input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="😊"
                    className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Cor</label>
                  <input type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-full h-10 rounded-xl border border-cream-200 cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Ordem</label>
                  <input type="number" value={catForm.order} onChange={(e) => setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveCategory} disabled={catSaving}>
                {catSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {catSaving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setShowCatForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-foreground/40">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma categoria cadastrada ainda.</p>
          </CardContent>
        </Card>
      )}

      {categories.map((cat) => (
        <Card key={cat.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="flex items-center gap-2 flex-1 text-left">
                {expanded === cat.id ? <ChevronDown className="w-4 h-4 text-foreground/40" /> : <ChevronRight className="w-4 h-4 text-foreground/40" />}
                {cat.icon && <span className="text-lg">{cat.icon}</span>}
                <div>
                  <span className="font-semibold text-foreground">{cat.name}</span>
                  <span className="text-xs text-foreground/40 ml-2">({cat.questions.length} pergunta{cat.questions.length !== 1 ? "s" : ""})</span>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => openAddQuestion(cat.id)} className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors">
                  <Plus className="w-4 h-4 text-primary-500" />
                </button>
                <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors">
                  <Pencil className="w-4 h-4 text-foreground/50" />
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </CardHeader>

          {expanded === cat.id && (
            <CardContent className="pt-0 space-y-2">
              {/* Question form inline */}
              {showQForm === cat.id && (
                <div className="border border-primary-200 rounded-xl p-4 space-y-3 bg-primary-50/30 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{editingQ ? "Editar pergunta" : "Nova pergunta"}</span>
                    <button onClick={() => { setShowQForm(null); setEditingQ(null) }}><X className="w-4 h-4" /></button>
                  </div>
                  {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  <div>
                    <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Texto da pergunta *</label>
                    <textarea value={qForm.text} onChange={(e) => setQForm({ ...qForm, text: e.target.value })} rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Rótulo curto *</label>
                      <input value={qForm.shortLabel} onChange={(e) => setQForm({ ...qForm, shortLabel: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Tipo *</label>
                      <select value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300">
                        {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Peso</label>
                      <input type="number" step="0.1" value={qForm.weight} onChange={(e) => setQForm({ ...qForm, weight: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Idade mín.</label>
                      <input type="number" value={qForm.minAge} onChange={(e) => setQForm({ ...qForm, minAge: e.target.value })} placeholder="—"
                        className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1 block">Idade máx.</label>
                      <input type="number" value={qForm.maxAge} onChange={(e) => setQForm({ ...qForm, maxAge: e.target.value })} placeholder="—"
                        className="w-full px-3 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => saveQuestion(cat.id)} disabled={qSaving}>
                      {qSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {qSaving ? "Salvando..." : "Salvar pergunta"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowQForm(null); setEditingQ(null) }}>Cancelar</Button>
                  </div>
                </div>
              )}

              {cat.questions.length === 0 && showQForm !== cat.id && (
                <p className="text-sm text-foreground/40 text-center py-4">
                  Nenhuma pergunta nesta categoria.{" "}
                  <button onClick={() => openAddQuestion(cat.id)} className="text-primary-500 hover:underline">Adicionar</button>
                </p>
              )}

              {cat.questions.map((q, idx) => (
                <div key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border ${q.isActive ? "border-cream-200 bg-white" : "border-dashed border-cream-200 bg-cream-50 opacity-60"}`}>
                  <span className="text-xs text-foreground/30 font-mono mt-0.5 w-5 text-right flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded">{QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}</span>
                      <span className="text-xs text-foreground/40">Peso: {q.weight}</span>
                      {q.minAge && <span className="text-xs text-foreground/40">Min: {q.minAge}a</span>}
                      {q.maxAge && <span className="text-xs text-foreground/40">Max: {q.maxAge}a</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleQuestion(q)} className="p-1.5 rounded-lg hover:bg-cream-100">
                      {q.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-foreground/30" />}
                    </button>
                    <button onClick={() => openEditQuestion(q)} className="p-1.5 rounded-lg hover:bg-cream-100">
                      <Pencil className="w-3.5 h-3.5 text-foreground/50" />
                    </button>
                    <button onClick={() => deleteQuestion(q.id, cat.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
