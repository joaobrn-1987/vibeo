import Link from "next/link"
import { Heart, ArrowLeft, Shield } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function PrivacidadePage() {
  const policy = await prisma.privacyPolicy.findFirst({ where: { isActive: true } })

  return (
    <div className="min-h-screen bg-cream-100">
      <nav className="sticky top-0 z-50 glass border-b border-cream-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl text-primary-700">Vibeo</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="vibeo-card p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="font-display font-black text-4xl text-foreground">Política de Privacidade</h1>
              {policy && (
                <p className="text-sm text-foreground/40">Versão {policy.version} · Vigente desde {new Date(policy.publishedAt!).toLocaleDateString("pt-BR")}</p>
              )}
            </div>
          </div>

          {policy?.summary && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-green-800 mb-2">Resumo</h3>
              <p className="text-sm text-green-700 leading-relaxed">{policy.summary}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/70 leading-relaxed">
              {policy?.content || "Política de privacidade em elaboração."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
