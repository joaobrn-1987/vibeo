"use client"
import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Heart, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"

const schema = z.object({
  email: z.string().email("E-mail inválido"),
})

type FormData = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError("Ocorreu um erro. Tente novamente.")
      }
    } catch {
      setError("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 mb-8 text-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar para login</span>
        </Link>

        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-2xl text-primary-700">Vibeo</span>
        </Link>

        <div className="vibeo-card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-3">E-mail enviado!</h2>
              <p className="text-foreground/60 mb-6 leading-relaxed">
                Se este e-mail estiver cadastrado, você receberá um link de redefinição de senha em breve. Verifique sua caixa de entrada.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Voltar ao login</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-display font-black text-2xl text-foreground mb-2">Recuperar senha</h1>
                <p className="text-sm text-foreground/60">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              {error && <Alert variant="error" description={error} className="mb-4" />}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
