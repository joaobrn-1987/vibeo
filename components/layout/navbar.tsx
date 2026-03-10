"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-cream-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-primary-700">Vibeo</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/#como-funciona" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            Como funciona
          </Link>
          <Link href="/#privacidade" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <Link href="/termos" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            Termos
          </Link>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/cadastro">
            <Button size="sm">Começar</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
