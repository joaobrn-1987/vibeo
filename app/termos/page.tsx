import Link from "next/link"
import { Heart, ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function TermosPage() {
  const terms = await prisma.termsOfUse.findFirst({ where: { isActive: true } })

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
          <div className="mb-8">
            <h1 className="font-display font-black text-4xl text-foreground mb-2">Termos de Uso</h1>
            {terms && (
              <p className="text-sm text-foreground/40">Versão {terms.version} · Vigente desde {new Date(terms.publishedAt!).toLocaleDateString("pt-BR")}</p>
            )}
          </div>

          {terms?.summary && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-primary-800 mb-2">Resumo</h3>
              <p className="text-sm text-primary-700 leading-relaxed">{terms.summary}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/70 leading-relaxed">
              {terms?.content || "Termos de uso em elaboração."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
