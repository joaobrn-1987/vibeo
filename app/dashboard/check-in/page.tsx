"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, ChevronRight, ChevronLeft, Check, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert } from "@/components/ui/alert"

const QUESTIONS = [
  {
    id: "overallMood",
    category: "Humor",
    emoji: "😊",
    question: "Como você está se sentindo hoje, de um modo geral?",
    type: "scale",
    min: 1,
    max: 10,
    labels: { 1: "Muito mal", 5: "Mais ou menos", 10: "Ótimo!" },
  },
  {
    id: "energyLevel",
    category: "Energia",
    emoji: "⚡",
    question: "Qual é o seu nível de energia hoje?",
    type: "scale",
    min: 1,
    max: 10,
    labels: { 1: "Sem energia", 5: "Regular", 10: "Com muita energia" },
  },
  {
    id: "anxietyLevel",
    category: "Ansiedade",
    emoji: "😰",
    question: "Você está sentindo ansiedade hoje?",
    type: "scale",
    min: 1,
    max: 10,
    labels: { 1: "Nenhuma", 5: "Moderada", 10: "Muita" },
    inverted: true,
  },
  {
    id: "sleepQuality",
    category: "Sono",
    emoji: "😴",
    question: "Como foi sua qualidade de sono ontem à noite?",
    type: "scale",
    min: 1,
    max: 10,
    labels: { 1: "Péssimo", 5: "Regular", 10: "Ótimo!" },
  },
  {
    id: "motivation",
    category: "Motivação",
    emoji: "🌟",
    question: "Qual é o seu nível de motivação hoje?",
    type: "scale",
    min: 1,
    max: 10,
    labels: { 1: "Sem vontade", 5: "Regular", 10: "Muito motivado!" },
  },
  {
    id: "dominantFeeling",
    category: "Sentimento",
    emoji: "💭",
    question: "Qual sentimento está mais presente em você agora?",
    type: "choice",
    options: [
      { value: "Alegre", emoji: "😄" },
      { value: "Calmo(a)", emoji: "😌" },
      { value: "Ansioso(a)", emoji: "😰" },
      { value: "Triste", emoji: "😔" },
      { value: "Irritado(a)", emoji: "😤" },
      { value: "Entediado(a)", emoji: "😐" },
      { value: "Esperançoso(a)", emoji: "🌈" },
      { value: "Sobrecarregado(a)", emoji: "😓" },
    ],
  },
  {
    id: "freeText",
    category: "Relato livre",
    emoji: "📝",
    question: "Quer me contar algo sobre como está se sentindo? (opcional)",
    type: "text",
    optional: true,
    placeholder: "Pode escrever à vontade. Este é seu espaço.",
  },
]

const RISK_KEYWORDS = [
  "suicídio", "suicidio", "me matar", "matar", "acabar com tudo",
  "não quero mais viver", "nao quero mais viver", "desaparecer",
  "autolesão", "autolesao", "me machucar", "me cortar",
]

function detectRisk(text: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return RISK_KEYWORDS.some(kw => lower.includes(kw))
}

export default function CheckInPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [riskDetected, setRiskDetected] = useState(false)
  const [completed, setCompleted] = useState(false)

  const question = QUESTIONS[currentStep]
  const progress = ((currentStep) / QUESTIONS.length) * 100

  function handleAnswer(value: any) {
    const newAnswers = { ...answers, [question.id]: value }
    setAnswers(newAnswers)

    // Check for risk in free text
    if (question.id === "freeText" && typeof value === "string") {
      if (detectRisk(value)) {
        setRiskDetected(true)
        return
      }
    }

    // Check mood/anxiety risk
    if (question.id === "overallMood" && value <= 2) {
      // flag but continue
    }

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      })
      if (res.ok) {
        setCompleted(true)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  if (riskDetected) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-3xl p-8 border border-primary-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
          </div>
          <h2 className="font-display font-bold text-2xl text-primary-800 mb-4">
            Você não está sozinho(a) 💙
          </h2>
          <p className="text-primary-700 leading-relaxed mb-6">
            Percebemos que você está passando por um momento muito difícil. Queremos que saiba que nos importamos com você e que existem pessoas prontas para ajudar.
          </p>
          <div className="space-y-3 mb-6">
            <a href="tel:188" className="flex items-center justify-center gap-3 w-full py-3.5 px-5 bg-white rounded-2xl border border-primary-200 font-semibold text-primary-700 hover:bg-primary-50 transition-colors">
              📞 CVV – Centro de Valorização da Vida: <strong>188</strong>
            </a>
            <p className="text-xs text-primary-600">Gratuito, sigiloso, disponível 24 horas por dia</p>
            <a href="tel:192" className="flex items-center justify-center gap-3 w-full py-3.5 px-5 bg-white rounded-2xl border border-primary-200 font-semibold text-primary-700 hover:bg-primary-50 transition-colors">
              🚑 SAMU: <strong>192</strong>
            </a>
          </div>
          <p className="text-sm text-primary-600 mb-6">
            Por favor, converse com um adulto de confiança — um familiar, amigo próximo ou qualquer pessoa que possa estar presente com você agora.
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
            Voltar ao início
          </Button>
        </div>
      </div>
    )
  }

  if (completed) {
    const mood = answers.overallMood || 5
    const isGood = mood >= 7
    const isLow = mood <= 3

    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="vibeo-card p-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display font-bold text-3xl text-foreground mb-3">
            Check-in concluído! 🎉
          </h2>
          <p className="text-foreground/60 mb-6 leading-relaxed">
            {isGood
              ? "Que ótimo saber que você está bem! Continue cuidando de você."
              : isLow
              ? "Obrigado por compartilhar. Sabemos que pode ser difícil. Cuide-se com carinho."
              : "Obrigado por compartilhar como está se sentindo. Cada check-in importa!"}
          </p>

          {isLow && (
            <Alert variant="safety" title="Precisa de apoio?" description="Se sentir que precisa conversar com alguém, o CVV atende gratuitamente pelo 188, 24h por dia." className="mb-6 text-left" />
          )}

          <div className="flex gap-3">
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="flex-1">
              Ir ao início
            </Button>
            <Button onClick={() => router.push("/dashboard/historico")} className="flex-1">
              Ver histórico
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isLastQuestion = currentStep === QUESTIONS.length - 1

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground/60">
            Pergunta {currentStep + 1} de {QUESTIONS.length}
          </p>
          <p className="text-sm font-medium text-primary-600">{Math.round(progress)}%</p>
        </div>
        <Progress value={progress} color="primary" />
      </div>

      <Card>
        <CardContent className="p-5 sm:p-8">
          {/* Category */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl">{question.emoji}</span>
            <span className="text-sm font-semibold text-foreground/40 uppercase tracking-wider">{question.category}</span>
          </div>

          {/* Question */}
          <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground mb-6 sm:mb-8 leading-tight">
            {question.question}
          </h2>

          {/* Scale input */}
          {question.type === "scale" && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const isSelected = answers[question.id] === n
                  let colorClass = "bg-cream-100 hover:bg-primary-50 border-cream-200 hover:border-primary-200 text-foreground/60"
                  if (isSelected) {
                    if (question.inverted) {
                      colorClass = n <= 3 ? "bg-green-500 border-green-500 text-white" :
                        n <= 6 ? "bg-yellow-500 border-yellow-500 text-white" :
                        "bg-red-500 border-red-500 text-white"
                    } else {
                      colorClass = n >= 7 ? "bg-green-500 border-green-500 text-white" :
                        n >= 4 ? "bg-yellow-500 border-yellow-500 text-white" :
                        "bg-red-500 border-red-500 text-white"
                    }
                  }
                  return (
                    <button
                      key={n}
                      onClick={() => handleAnswer(n)}
                      className={`min-h-[44px] rounded-xl font-bold text-sm transition-all duration-150 hover:scale-105 border-2 ${colorClass}`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-foreground/40">
                <span>{question.labels?.[1]}</span>
                <span>{question.labels?.[10]}</span>
              </div>
            </div>
          )}

          {/* Choice input */}
          {question.type === "choice" && (
            <div className="grid grid-cols-2 gap-3">
              {question.options?.map((opt) => {
                const isSelected = answers[question.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${
                      isSelected
                        ? "border-primary-400 bg-primary-50 shadow-soft"
                        : "border-cream-200 bg-white hover:border-primary-200 hover:bg-cream-50"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{opt.value}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Text input */}
          {question.type === "text" && (
            <div className="space-y-4">
              <textarea
                className="w-full h-32 vibeo-input resize-none"
                placeholder={question.placeholder}
                value={answers[question.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              />
              <div className="flex gap-3">
                {question.optional && (
                  <Button variant="outline" onClick={() => handleAnswer("")} className="flex-1">
                    Pular
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (detectRisk(answers[question.id] || "")) {
                      setRiskDetected(true)
                    } else {
                      handleSubmit()
                    }
                  }}
                  className="flex-1"
                  loading={loading}
                >
                  Concluir check-in
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {isLastQuestion && question.type !== "text" && (
            <div className="mt-6">
              <Button onClick={handleSubmit} className="w-full" loading={loading}>
                Concluir check-in
                <Check className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? "bg-primary-500 w-4" : i < currentStep ? "bg-primary-300" : "bg-cream-300"
              }`}
            />
          ))}
        </div>
        <div className="w-24" />
      </div>

      {/* Safety note */}
      <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-600">
          Suas respostas são privadas. Em emergências: <strong>188</strong> (CVV) | <strong>192</strong> (SAMU)
        </p>
      </div>
    </div>
  )
}
