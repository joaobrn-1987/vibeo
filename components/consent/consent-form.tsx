"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface Props {
  token: string
  minorName: string
}

export function ConsentForm({ token, minorName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null)
  const [done, setDone] = useState<"approved" | "denied" | null>(null)

  async function handleConsent(action: "approve" | "deny") {
    setLoading(action)
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      })
      if (res.ok) {
        setDone(action)
        if (action === "approve") {
          setTimeout(() => router.push("/login?consent=approved"), 3000)
        }
      }
    } finally {
      setLoading(null)
    }
  }

  if (done === "approved") {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <p className="font-bold text-green-700 mb-1">Consentimento confirmado!</p>
        <p className="text-sm text-foreground/60">A conta de {minorName} foi ativada. Redirecionando...</p>
      </div>
    )
  }

  if (done === "denied") {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <X className="w-7 h-7 text-red-600" />
        </div>
        <p className="font-bold text-red-700 mb-1">Cadastro recusado</p>
        <p className="text-sm text-foreground/60">O cadastro de {minorName} foi recusado conforme sua solicitação.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-foreground/40 text-center mb-4">
        Ao confirmar, você declara ser o responsável legal de {minorName} e que leu e concordou com os Termos de Uso e Política de Privacidade do Vibeo.
      </p>
      <Button
        onClick={() => handleConsent("approve")}
        className="w-full"
        loading={loading === "approve"}
      >
        <Check className="w-4 h-4" />
        Confirmar consentimento
      </Button>
      <Button
        onClick={() => handleConsent("deny")}
        variant="outline"
        className="w-full border-red-200 text-red-600 hover:bg-red-50"
        loading={loading === "deny"}
      >
        <X className="w-4 h-4" />
        Recusar cadastro
      </Button>
    </div>
  )
}
