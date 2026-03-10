"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserX, UserCheck, Loader2 } from "lucide-react"

interface Props {
  blocked: boolean
}

export function RegistrationToggle({ blocked: initialBlocked }: Props) {
  const router = useRouter()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    const newVal = !blocked
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "REGISTRATIONS_BLOCKED", value: String(newVal) }),
    })
    if (res.ok) {
      setBlocked(newVal)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all min-h-[44px] ${
        blocked
          ? "bg-red-500 hover:bg-red-600 text-white shadow-md"
          : "bg-cream-100 hover:bg-cream-200 text-foreground border border-cream-200"
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : blocked ? (
        <UserX className="w-4 h-4" />
      ) : (
        <UserCheck className="w-4 h-4" />
      )}
      {saving ? "Salvando..." : blocked ? "Cadastros bloqueados" : "Bloquear novos cadastros"}
    </button>
  )
}
