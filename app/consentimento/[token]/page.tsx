import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Heart, Shield, Check } from "lucide-react"
import { ConsentForm } from "@/components/consent/consent-form"

interface Props {
  params: { token: string }
}

export default async function ConsentimentoPage({ params }: Props) {
  const consent = await prisma.guardianConsent.findUnique({
    where: { consentToken: params.token },
    include: { minorUser: { include: { profile: true } } },
  })

  if (!consent) notFound()

  const isExpired = new Date() > consent.expiresAt
  const isAlreadyHandled = consent.status !== "PENDING"

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-2xl text-primary-700">Vibeo</span>
        </Link>

        <div className="vibeo-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Consentimento de Responsável</h1>
              <p className="text-sm text-foreground/50">Plataforma Vibeo</p>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="font-semibold text-red-700">Este link expirou.</p>
              <p className="text-sm text-red-600 mt-1">Por favor, peça para {consent.minorUser.profile?.fullName} refazer o cadastro.</p>
            </div>
          )}

          {!isExpired && isAlreadyHandled && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-700">
                {consent.status === "APPROVED" ? "Consentimento já confirmado!" : "Consentimento já processado."}
              </p>
            </div>
          )}

          {!isExpired && !isAlreadyHandled && (
            <>
              <div className="bg-cream-100 rounded-2xl p-5 mb-6">
                <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                  <strong>{consent.minorUser.profile?.fullName}</strong> ({new Date().getFullYear() - new Date(consent.minorUser.profile?.birthDate!).getFullYear()} anos) realizou um cadastro no Vibeo e indicou você, <strong>{consent.guardianName}</strong>, como responsável legal.
                </p>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  O Vibeo é uma plataforma de <strong>acompanhamento emocional</strong> para jovens. Não realizamos diagnósticos clínicos e não substituímos atendimento profissional.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
                <p className="text-xs font-semibold text-blue-700 mb-2">O que acontece ao confirmar?</p>
                <ul className="space-y-1.5">
                  {[
                    "A conta de " + consent.minorUser.profile?.fullName + " será ativada",
                    "Ela poderá usar o Vibeo para acompanhamento emocional",
                    "Você pode revogar o consentimento a qualquer momento",
                    "Os dados são protegidos conforme a LGPD",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <ConsentForm token={params.token} minorName={consent.minorUser.profile?.fullName || "o menor"} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
