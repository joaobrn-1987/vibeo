"use client"
import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Heart, Eye, EyeOff, Mail, Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
})
type LoginForm = z.infer<typeof loginSchema>

const errorMessages: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  CONSENT_PENDING: "Sua conta aguarda o consentimento do responsável legal.",
  ACCOUNT_INACTIVE: "Sua conta está inativa. Entre em contato com o suporte.",
  CredentialsSignin: "E-mail ou senha incorretos.",
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const callbackError = searchParams.get("error")
  const registered = searchParams.get("registered")
  const consent = searchParams.get("consent")

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)
    try {
      const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false })
      if (result?.error) {
        setError(errorMessages[result.error] || "Ocorreu um erro. Tente novamente.")
      } else {
        const callbackUrl = searchParams.get("callbackUrl")
        window.location.href = callbackUrl || "/dashboard"
      }
    } catch {
      setError("Ocorreu um erro inesperado.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        <div className="blob-pink w-96 h-96 -top-20 -left-20 opacity-20" style={{position:'absolute'}} />
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-black text-3xl">Vibeo</span>
          </Link>
          <h2 className="font-display font-black text-4xl leading-tight mb-6">Bem-vindo de<br />volta. 💙</h2>
          <p className="text-white/70 text-lg leading-relaxed mb-10">Continue cuidando do seu bem-estar emocional. Estamos aqui por você.</p>
          <div className="space-y-4">
            {["✨ Check-in emocional diário", "📊 Acompanhe sua evolução", "🤖 IA acolhedora e responsável"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80"><span>{item}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-2xl text-primary-700">Vibeo</span>
          </Link>
          <div className="mb-8">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground mb-2">Entrar</h1>
            <p className="text-foreground/60">Acesse sua conta para continuar.</p>
          </div>
          {registered && <Alert variant="success" title="Conta criada!" description="Verifique seu e-mail para ativar sua conta." className="mb-6" />}
          {consent === "approved" && <Alert variant="success" title="Consentimento confirmado!" description="Sua conta foi ativada. Bem-vindo(a) ao Vibeo!" className="mb-6" />}
          {(error || callbackError) && <Alert variant="error" description={error || errorMessages[callbackError!] || "Erro ao entrar."} className="mb-6" />}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="E-mail" type="email" placeholder="seu@email.com" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} autoComplete="email" {...register("email")} />
            <div>
              <Input label="Senha" type={showPassword ? "text" : "password"} placeholder="Sua senha" leftIcon={<Lock className="w-4 h-4" />} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} error={errors.password?.message} autoComplete="current-password" {...register("password")} />
              <div className="flex justify-end mt-1.5"><Link href="/recuperar-senha" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Esqueci minha senha</Link></div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          </form>
          <p className="text-center text-sm text-foreground/60 mt-6">Não tem conta?{" "}<Link href="/cadastro" className="text-primary-600 font-semibold hover:text-primary-700">Criar conta gratuita</Link></p>
          <div className="mt-8 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">O Vibeo não substitui atendimento profissional. Em urgências: <strong>CVV 188</strong> | <strong>SAMU 192</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
