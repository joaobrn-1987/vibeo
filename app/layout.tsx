import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"

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
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
