import { Shield, Phone } from "lucide-react"

interface SafetyBannerProps {
  variant?: "minimal" | "full"
  className?: string
}

export function SafetyBanner({ variant = "minimal", className = "" }: SafetyBannerProps) {
  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 ${className}`}>
        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          O Vibeo é uma ferramenta de acompanhamento emocional. Em situações de urgência, procure ajuda profissional ou ligue <strong>188</strong> (CVV) ou <strong>192</strong> (SAMU).
        </p>
      </div>
    )
  }

  return (
    <div className={`p-5 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-primary-100 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h4 className="font-semibold text-primary-800 text-sm mb-1">Aviso importante</h4>
          <p className="text-sm text-primary-700 leading-relaxed mb-3">
            O Vibeo é uma plataforma de acompanhamento emocional e <strong>não substitui atendimento psicológico, psiquiátrico ou médico</strong>. Em situações de urgência ou risco imediato:
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="tel:188" className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-primary-200 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              CVV: 188
            </a>
            <a href="tel:192" className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-primary-200 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              SAMU: 192
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
