import Link from "next/link"
import { Heart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-2xl text-primary-700">Vibeo</span>
        </Link>
        <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="font-display font-black text-3xl text-foreground mb-3">Algo deu errado</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          Ocorreu um erro inesperado. Tente novamente em alguns instantes.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button variant="outline">Página inicial</Button></Link>
          <Link href="/login"><Button>Entrar</Button></Link>
        </div>
      </div>
    </div>
  )
}
