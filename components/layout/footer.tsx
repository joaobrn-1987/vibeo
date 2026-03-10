import Link from "next/link"
import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-cream-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="font-display font-bold text-xl text-primary-700">Vibeo</span>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-xs">
              Plataforma de acompanhamento emocional para jovens e adolescentes. Cuide do seu bem-estar com a gente.
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Aviso importante:</strong> O Vibeo é uma ferramenta de acompanhamento emocional e não substitui atendimento psicológico, psiquiátrico ou médico. Em situações de urgência, ligue 192 (SAMU) ou 188 (CVV).
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Plataforma</h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Início" },
                { href: "/login", label: "Entrar" },
                { href: "/cadastro", label: "Criar conta" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground/60 hover:text-primary-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                { href: "/termos", label: "Termos de Uso" },
                { href: "/privacidade", label: "Política de Privacidade" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-foreground/60 hover:text-primary-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-cream-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-foreground/40">
            © 2024 Vibeo. Todos os direitos reservados.
          </p>
          <p className="text-xs text-foreground/40">
            Feito com <span className="text-accent-500">♥</span> para o bem-estar juvenil.
          </p>
        </div>
      </div>
    </footer>
  )
}
