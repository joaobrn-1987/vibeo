"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Heart, Eye, EyeOff, Mail, Lock, User, Calendar, Shield, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"

// Step 1: birth date only
// Step 2: full form

const step2Schema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").regex(/[A-Z]/, "Precisa ter uma letra maiúscula").regex(/[0-9]/, "Precisa ter um número").regex(/[^a-zA-Z0-9]/, "Precisa ter um caractere especial"),
  confirmPassword: z.string(),
  theme: z.enum(["FEMININE", "MASCULINE", "DIVERSITY"]),
  // If minor:
  guardianName: z.string().optional(),
  guardianEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  acceptTerms: z.boolean().refine(v => v, "Você precisa aceitar os termos"),
  acceptPrivacy: z.boolean().refine(v => v, "Você precisa aceitar a política de privacidade"),
}).refine(d => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type Step2Form = z.infer<typeof step2Schema>

const themes = [
  { value: "FEMININE", label: "Feminino", emoji: "🌸", gradient: "from-accent-400 to-accent-600", desc: "Rosa e delicado" },
  { value: "MASCULINE", label: "Masculino", emoji: "🌊", gradient: "from-primary-500 to-primary-700", desc: "Azul e forte" },
  { value: "DIVERSITY", label: "Diversidade", emoji: "🌈", gradient: "from-purple-500 to-teal-500", desc: "Colorido e livre" },
]

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [birthDate, setBirthDate] = useState("")
  const [isMinor, setIsMinor] = useState(false)
  const [age, setAge] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<"FEMININE" | "MASCULINE" | "DIVERSITY">("FEMININE")

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: { theme: "FEMININE", acceptTerms: false, acceptPrivacy: false },
  })

  function handleBirthDateSubmit() {
    if (!birthDate) return
    const birth = new Date(birthDate)
    const today = new Date()
    let calcAge = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) calcAge--

    if (calcAge < 10 || calcAge > 100) {
      setError("Informe uma data de nascimento válida.")
      return
    }

    setAge(calcAge)
    setIsMinor(calcAge < 18)
    setError(null)
    setStep(2)
  }

  async function onSubmit(data: Step2Form) {
    if (isMinor && (!data.guardianName || !data.guardianEmail)) {
      setError("Para menores de idade, informe o nome e e-mail do responsável legal.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          birthDate,
          age,
          isMinor,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error || "Erro ao criar conta. Tente novamente.")
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const watchAcceptTerms = watch("acceptTerms")
  const watchAcceptPrivacy = watch("acceptPrivacy")

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left - decorative */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-accent-500 to-primary-700 overflow-hidden">
        <div className="blob-pink w-96 h-96 -top-20 -left-20 opacity-20" style={{position:'absolute'}} />
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-black text-3xl">Vibeo</span>
          </Link>

          <h2 className="font-display font-black text-4xl leading-tight mb-6">
            Seu espaço de<br />cuidado começa<br />aqui. 💙
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Uma experiência de acompanhamento emocional feita com cuidado, responsabilidade e respeito por você.
          </p>

          {/* Steps indicator */}
          <div className="space-y-3">
            {[
              { n: 1, label: "Data de nascimento" },
              { n: 2, label: "Seus dados" },
              { n: 3, label: "Conta criada!" },
            ].map((s) => (
              <div key={s.n} className={`flex items-center gap-3 ${step >= s.n ? "text-white" : "text-white/40"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step > s.n ? "bg-white text-primary-600 border-white" : step === s.n ? "bg-white/20 border-white" : "border-white/30"}`}>
                  {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-2xl text-primary-700">Vibeo</span>
          </Link>

          {/* STEP 1 - Birth date */}
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h1 className="font-display font-black text-3xl text-foreground mb-2">Criar conta</h1>
                <p className="text-foreground/60">Primeiro, precisamos saber sua data de nascimento.</p>
              </div>

              <div className="vibeo-card p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Por que pedimos isso?</p>
                    <p className="text-xs text-foreground/50">Para garantir a proteção de menores de 18 anos.</p>
                  </div>
                </div>
                <p className="text-xs text-foreground/50 leading-relaxed">
                  Conforme a LGPD e boas práticas de proteção de dados, usuários menores de 18 anos precisam do consentimento do responsável legal para usar o Vibeo.
                </p>
              </div>

              {error && <Alert variant="error" description={error} className="mb-4" />}

              <div className="space-y-5">
                <Input
                  label="Data de nascimento"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
                <Button onClick={handleBirthDateSubmit} className="w-full" size="lg" disabled={!birthDate}>
                  Continuar
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-center text-sm text-foreground/60 mt-6">
                Já tem conta?{" "}
                <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Entrar
                </Link>
              </p>
            </div>
          )}

          {/* STEP 2 - Full form */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground mb-4 transition-colors">
                  ← Voltar
                </button>
                <h1 className="font-display font-black text-3xl text-foreground mb-2">
                  {isMinor ? `Olá! Você tem ${age} anos.` : "Seus dados"}
                </h1>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  {isMinor
                    ? "Para sua proteção, precisamos do consentimento do seu responsável legal para ativar sua conta."
                    : "Complete seu cadastro para começar a usar o Vibeo."}
                </p>
              </div>

              {isMinor && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Conta de menor de idade</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Vamos enviar um e-mail ao seu responsável legal para confirmar o cadastro. Sua conta ficará inativa até a confirmação.
                    </p>
                  </div>
                </div>
              )}

              {error && <Alert variant="error" description={error} className="mb-4" />}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nome completo"
                  placeholder="Seu nome completo"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.fullName?.message}
                  required
                  {...register("fullName")}
                />

                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  required
                  {...register("email")}
                />

                <Input
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  hint="Mínimo 8 caracteres, com maiúscula, número e caractere especial"
                  required
                  {...register("password")}
                />

                <Input
                  label="Confirmar senha"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repita sua senha"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.confirmPassword?.message}
                  required
                  {...register("confirmPassword")}
                />

                {/* Theme selection */}
                <div>
                  <label className="vibeo-label">Tema visual preferido</label>
                  <div className="grid grid-cols-3 gap-3 mt-1.5">
                    {themes.map((theme) => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => { setSelectedTheme(theme.value as any); setValue("theme", theme.value as any) }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150 ${
                          selectedTheme === theme.value
                            ? "border-primary-400 bg-primary-50 shadow-soft"
                            : "border-cream-200 bg-white hover:border-primary-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-xl`}>
                          {theme.emoji}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{theme.label}</span>
                        <span className="text-xs text-foreground/40">{theme.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-foreground/40 mt-2">Você pode alterar isso depois nas configurações.</p>
                </div>

                {/* Guardian info for minors */}
                {isMinor && (
                  <div className="space-y-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-sm font-semibold text-amber-800">Dados do responsável legal</p>
                    <Input
                      label="Nome do responsável"
                      placeholder="Nome completo do responsável"
                      leftIcon={<User className="w-4 h-4" />}
                      error={errors.guardianName?.message}
                      required
                      {...register("guardianName")}
                    />
                    <Input
                      label="E-mail do responsável"
                      type="email"
                      placeholder="email@responsavel.com"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.guardianEmail?.message}
                      hint="Enviaremos um link de consentimento para este e-mail."
                      required
                      {...register("guardianEmail")}
                    />
                  </div>
                )}

                {/* Terms */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-2 border-primary-300 text-primary-600 cursor-pointer"
                      {...register("acceptTerms")}
                    />
                    <span className="text-xs text-foreground/70 leading-relaxed">
                      Li e concordo com os{" "}
                      <Link href="/termos" target="_blank" className="text-primary-600 underline font-medium">
                        Termos de Uso
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="text-xs text-red-500 ml-7">{errors.acceptTerms.message}</p>}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-2 border-primary-300 text-primary-600 cursor-pointer"
                      {...register("acceptPrivacy")}
                    />
                    <span className="text-xs text-foreground/70 leading-relaxed">
                      Li e concordo com a{" "}
                      <Link href="/privacidade" target="_blank" className="text-primary-600 underline font-medium">
                        Política de Privacidade
                      </Link>
                    </span>
                  </label>
                  {errors.acceptPrivacy && <p className="text-xs text-red-500 ml-7">{errors.acceptPrivacy.message}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  {loading ? "Criando conta..." : isMinor ? "Criar conta e enviar consentimento" : "Criar conta"}
                </Button>
              </form>

              <p className="text-center text-sm text-foreground/60 mt-6">
                Já tem conta?{" "}
                <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                  Entrar
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
