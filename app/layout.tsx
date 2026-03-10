import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export const metadata: Metadata = {
  title: {
    default: "Vibeo – Acompanhamento Emocional Juvenil",
    template: "%s | Vibeo",
  },
  description: "Plataforma de acompanhamento emocional para jovens e adolescentes. Escuta ativa, check-in diário e análise de bem-estar com IA responsável.",
  keywords: ["saúde mental", "bem-estar", "jovens", "adolescentes", "acompanhamento emocional"],
  authors: [{ name: "Vibeo" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vibeo.joaoneto.tec.br"),
  openGraph: {
    title: "Vibeo – Acompanhamento Emocional Juvenil",
    description: "Plataforma de acompanhamento emocional para jovens e adolescentes.",
    type: "website",
    locale: "pt_BR",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        {/* PWA manifest and meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4A6FA5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vibeo" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
