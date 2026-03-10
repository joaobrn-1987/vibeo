import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Entrar" }

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-hero flex items-center justify-center"><div className="animate-spin w-8 h-8 rounded-full border-4 border-cream-200 border-t-primary-500" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
