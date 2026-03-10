import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-2xl text-primary-700">Vibeo</span>
        </Link>
        <div className="mb-6">
          <p className="font-display font-black text-8xl text-primary-200">404</p>
        </div>
        <h1 className="font-display font-black text-3xl text-foreground mb-3">Página não encontrada</h1>
        <p className="text-foreground/60 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link href="/"><Button>Voltar ao início</Button></Link>
      </div>
    </div>
  )
}
