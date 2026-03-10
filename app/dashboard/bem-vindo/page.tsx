"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowRight, Loader2 } from "lucide-react"

const themes = [
  {
    value: "FEMININE",
    label: "Feminino",
    description: "Tons de rosa e aconchegantes",
    style: { background: "linear-gradient(135deg, #C4717A, #e8a0a7)" },
    // Button color when this theme is selected
    btnStyle: { background: "#C4717A", color: "#fff", boxShadow: "0 4px 24px rgba(196,113,122,0.35)" },
  },
  {
    value: "MASCULINE",
    label: "Masculino",
    description: "Azul marinho sólido e direto",
    style: { background: "#1B3A5C" },
    btnStyle: { background: "#1B3A5C", color: "#fff", boxShadow: "0 4px 24px rgba(27,58,92,0.35)" },
  },
  {
    value: "DIVERSITY",
    label: "LGBT+",
    description: "Todas as cores do arco-íris",
    style: {
      background: "linear-gradient(135deg, #E40303 0%, #FF8C00 20%, #FFED00 40%, #008026 60%, #004DFF 80%, #750787 100%)",
    },
    btnStyle: {
      background: "linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)",
      color: "#fff",
      boxShadow: "0 4px 24px rgba(117,7,135,0.30)",
    },
  },
]

export default function BemVindoPage() {
  const { data: session, update } = useSession()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const firstName = session?.user?.name?.split(" ")[0] || "por aí"

  async function handleConfirm() {
    if (!selected || saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selected }),
      })
      if (!res.ok) {
        setSaving(false)
        return
      }
      // Update JWT session with new values
      await update({ theme: selected, onboardingCompleted: true })
      // Hard navigation so the middleware re-reads the updated JWT cookie
      // router.push() would redirect before the new JWT is set
      window.location.href = "/dashboard"
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-5 shadow-card">
            <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
              <path d="M12 21.593c-.5-.396-9-7.04-9-12.093 0-3.31 2.69-6 6-6 1.88 0 3.55.87 4.64 2.23.22.27.42.57.6.88.18-.31.38-.61.6-.88C15.95 4.37 17.62 3.5 19.5 3.5c3.31 0 6 2.69 6 6 0 5.053-8.5 11.697-9 12.093z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-foreground/60 text-base">
            Bem-vindo ao Vibeo. Antes de começar,<br />
            <strong>escolha o tema visual</strong> que mais combina com você.
          </p>
          <p className="text-xs text-foreground/40 mt-2">Você pode mudar isso a qualquer momento no seu perfil.</p>
        </div>

        {/* Theme cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {themes.map((theme) => (
            <motion.button
              key={theme.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(theme.value)}
              className={`relative rounded-2xl border-2 p-0 overflow-hidden text-left transition-all duration-150 shadow-soft ${
                selected === theme.value
                  ? "border-primary-500 ring-2 ring-primary-300 ring-offset-2"
                  : "border-cream-200 hover:border-primary-200"
              }`}
            >
              {/* Color preview strip */}
              <div className="h-24 w-full" style={theme.style} />

              {/* Info */}
              <div className="p-4 bg-white">
                <p className="font-bold text-sm text-foreground">{theme.label}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{theme.description}</p>
              </div>

              {/* Selected checkmark */}
              <AnimatePresence>
                {selected === theme.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: "#4A6FA5" }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Confirm button — inline style to avoid theme CSS overrides on this page */}
        <motion.button
          whileHover={selected && !saving ? { scale: 1.02 } : {}}
          whileTap={selected && !saving ? { scale: 0.98 } : {}}
          onClick={handleConfirm}
          disabled={!selected || saving}
          style={
            selected && !saving
              ? (themes.find(t => t.value === selected)?.btnStyle ?? { background: "#4A6FA5", color: "#fff" })
              : { background: "#EDE3D5", color: "#aaa", cursor: "not-allowed" }
          }
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando seu tema...
            </>
          ) : (
            <>
              {selected
                ? `Começar com o tema ${themes.find(t => t.value === selected)?.label}`
                : "Selecione um tema para continuar"}
              {selected && <ArrowRight className="w-5 h-5" />}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}
