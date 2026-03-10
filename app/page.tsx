import Link from "next/link"
import { Heart, Shield, Brain, ChevronRight, Check, Star, Users, TrendingUp, Lock, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="blob-pink w-[500px] h-[500px] -top-32 -left-32 opacity-60" style={{position:'absolute'}} />
        <div className="blob-blue w-[400px] h-[400px] -top-16 right-0 opacity-50" style={{position:'absolute'}} />
        <div className="blob-pink w-[300px] h-[300px] bottom-0 right-1/4 opacity-40" style={{position:'absolute'}} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold mb-6">
                <Heart className="w-4 h-4" fill="currentColor" />
                Acompanhamento emocional com IA
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-[1.05] mb-6">
                Cuide do seu
                <span className="block text-gradient-accent">bem-estar</span>
                <span className="block text-primary-600">emocional</span>
              </h1>

              <p className="text-lg text-foreground/60 leading-relaxed mb-8 max-w-lg">
                O Vibeo é seu espaço seguro de acompanhamento emocional. Faça check-ins diários, acompanhe sua evolução e receba suporte acolhedor — tudo com responsabilidade e respeito.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/cadastro">
                  <Button size="xl" className="w-full sm:w-auto">
                    Começar agora
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#como-funciona">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    Como funciona
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  "Gratuito para começar",
                  "Seguro e privado",
                  "Para jovens 13+",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-foreground/60">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right illustration */}
            <div className="relative flex justify-center lg:justify-end animate-fade-in">
              <div className="relative">
                {/* Main card */}
                <div className="w-72 bg-white rounded-3xl shadow-hover p-6 border border-cream-200">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Olá, Ana! ✨</p>
                      <p className="text-xs text-foreground/40">Como você está hoje?</p>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
                    "Parece que você está indo bem essa semana! Seu humor melhorou 23% em relação à semana passada. 🌟"
                  </p>

                  {/* Mood indicators */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Humor", value: 8, emoji: "😊", color: "bg-green-100 text-green-700" },
                      { label: "Energia", value: 7, emoji: "⚡", color: "bg-yellow-100 text-yellow-700" },
                      { label: "Sono", value: 6, emoji: "😴", color: "bg-blue-100 text-blue-700" },
                    ].map((m) => (
                      <div key={m.label} className={`${m.color} rounded-xl p-2 text-center`}>
                        <div className="text-lg">{m.emoji}</div>
                        <div className="text-xs font-bold">{m.value}/10</div>
                        <div className="text-xs opacity-70">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini chart bars */}
                  <div className="flex items-end gap-1 h-12 mb-2">
                    {[5,6,4,7,8,7,8].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary-400 to-primary-300 opacity-80 transition-all" style={{height: `${h*10}%`}} />
                    ))}
                  </div>
                  <p className="text-xs text-foreground/40 text-center">Últimos 7 dias</p>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-card px-4 py-3 border border-cream-200 animate-float">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">+23%</p>
                      <p className="text-xs text-foreground/40">Esta semana</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card px-4 py-3 border border-cream-200 animate-float" style={{animationDelay: '1.5s'}}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">100% seguro</p>
                      <p className="text-xs text-foreground/40">LGPD compliant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-white border-y border-cream-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "15-29", label: "Faixa etária principal", sub: "anos" },
              { value: "1 em 4", label: "Jovens com sofrimento emocional", sub: "no mundo" },
              { value: "188", label: "CVV – apoio gratuito", sub: "24h por dia" },
              { value: "100%", label: "Privacidade e segurança", sub: "LGPD" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display font-black text-3xl text-primary-600">{stat.value}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-foreground/40">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-foreground mb-4">
              Como o Vibeo funciona?
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Uma experiência simples, acolhedora e adaptada a você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Users className="w-7 h-7 text-primary-600" />,
                title: "Crie sua conta",
                desc: "Cadastro simples, seguro e com verificação de identidade. Para menores de 18 anos, solicitamos o consentimento do responsável.",
                color: "bg-primary-50 border-primary-100",
              },
              {
                step: "02",
                icon: <Heart className="w-7 h-7 text-accent-600" />,
                title: "Check-in diário",
                desc: "Responda perguntas curtas sobre como você está se sentindo. Nossa IA acolhedora adapta as perguntas ao seu histórico.",
                color: "bg-accent-50 border-accent-100",
              },
              {
                step: "03",
                icon: <TrendingUp className="w-7 h-7 text-green-600" />,
                title: "Acompanhe sua evolução",
                desc: "Visualize seu progresso em gráficos bonitos, receba insights personalizados e sugestões de autocuidado.",
                color: "bg-green-50 border-green-100",
              },
            ].map((item) => (
              <div key={item.step} className="vibeo-card p-8 text-center group">
                <div className="text-5xl font-black text-cream-200 font-display mb-4 group-hover:text-cream-300 transition-colors">
                  {item.step}
                </div>
                <div className={`w-14 h-14 rounded-2xl ${item.color} border flex items-center justify-center mx-auto mb-4`}>
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-foreground mb-6">
                Feito para <span className="text-gradient-accent">você</span>, do jeito que você merece
              </h2>
              <div className="space-y-5">
                {[
                  { icon: "🎨", title: "3 temas visuais", desc: "Escolha o tema que mais combina com você: feminino, masculino ou diversidade." },
                  { icon: "🤖", title: "IA acolhedora", desc: "Nossa IA faz perguntas adaptativas e constrói memória do seu histórico emocional." },
                  { icon: "📊", title: "Histórico longitudinal", desc: "Veja sua evolução ao longo de dias, semanas e meses com gráficos elegantes." },
                  { icon: "🔒", title: "Privacidade total", desc: "Seus dados são protegidos pela LGPD. Você controla tudo." },
                  { icon: "💙", title: "Linguagem humana", desc: "Sem jargões médicos. Comunicação acolhedora, jovem e respeitosa." },
                ].map((feat) => (
                  <div key={feat.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{feat.title}</h4>
                      <p className="text-sm text-foreground/60 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Theme cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Feminino", gradient: "from-accent-400 to-accent-600", emoji: "🌸" },
                  { name: "Masculino", gradient: "from-primary-500 to-primary-700", emoji: "🌊" },
                  { name: "Diversidade", gradient: "from-purple-500 to-teal-500", emoji: "🌈" },
                ].map((theme) => (
                  <div key={theme.name} className="vibeo-card p-4 text-center cursor-pointer group">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                      {theme.emoji}
                    </div>
                    <p className="text-xs font-semibold text-foreground/70">{theme.name}</p>
                  </div>
                ))}
              </div>

              {/* AI chat preview */}
              <div className="vibeo-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Vibeo IA</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <p className="text-xs text-foreground/40">Online agora</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-primary-50 rounded-2xl rounded-tl-sm p-3">
                    <p className="text-sm text-primary-800">Oi! Como foi seu dia hoje? Notei que ontem você mencionou estar um pouco ansioso(a). 💙</p>
                  </div>
                  <div className="bg-cream-100 rounded-2xl rounded-tr-sm p-3 ml-8">
                    <p className="text-sm text-foreground/70">Melhor! Consegui dormir melhor e me sinto mais calmo hoje.</p>
                  </div>
                  <div className="bg-primary-50 rounded-2xl rounded-tl-sm p-3">
                    <p className="text-sm text-primary-800">Que ótimo ouvir isso! Fico feliz. Que tal me contar um pouco mais sobre o que te ajudou?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY SECTION */}
      <section id="privacidade" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="vibeo-card p-6 sm:p-10 bg-gradient-to-br from-primary-50 to-cream-100 border-primary-100 relative overflow-hidden">
            <div className="blob-blue w-64 h-64 -top-16 -right-16 opacity-30" style={{position:'absolute'}} />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-6 h-6 text-primary-600" />
                  <h2 className="font-display text-3xl font-black text-foreground">
                    Sua privacidade, nossa prioridade
                  </h2>
                </div>
                <p className="text-foreground/60 leading-relaxed mb-6">
                  O Vibeo foi construído desde o início com privacidade por padrão. Seguimos rigorosamente a LGPD e as orientações da ANPD para proteção de dados pessoais sensíveis e dados de crianças e adolescentes.
                </p>
                <div className="space-y-3">
                  {[
                    "Coletamos apenas dados necessários",
                    "Dados de menores com proteção reforçada",
                    "Consentimento específico e documentado",
                    "Você pode exportar ou excluir seus dados",
                    "Nunca vendemos seus dados",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground/70">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Shield className="w-6 h-6 text-primary-600" />, title: "LGPD", desc: "Totalmente aderente", bg: "bg-primary-50 border-primary-100" },
                  { icon: <Lock className="w-6 h-6 text-green-600" />, title: "Dados Seguros", desc: "Criptografia end-to-end", bg: "bg-green-50 border-green-100" },
                  { icon: <Users className="w-6 h-6 text-accent-600" />, title: "Menores", desc: "Proteção reforçada", bg: "bg-accent-50 border-accent-100" },
                  { icon: <Star className="w-6 h-6 text-amber-600" />, title: "Transparência", desc: "100% clara", bg: "bg-amber-50 border-amber-100" },
                ].map((item) => (
                  <div key={item.title} className={`${item.bg} border rounded-2xl p-4 text-center`}>
                    <div className="flex justify-center mb-2">{item.icon}</div>
                    <p className="font-bold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPORTANT NOTICE */}
      <section className="py-10 bg-blue-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Shield className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-blue-800 mb-2">Aviso importante</h3>
          <p className="text-sm text-blue-700 leading-relaxed max-w-2xl mx-auto mb-4">
            O Vibeo é uma ferramenta de acompanhamento emocional e <strong>não substitui atendimento psicológico, psiquiátrico ou médico</strong>. Não realizamos diagnósticos clínicos e não emitimos laudos.
            Em situações de urgência ou risco imediato, procure ajuda de um responsável ou profissional de saúde.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:188" className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors">
              <Phone className="w-4 h-4" />
              CVV: 188 (gratuito, 24h)
            </a>
            <a href="tel:192" className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors">
              <Phone className="w-4 h-4" />
              SAMU: 192
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-foreground/60 mb-8 max-w-xl mx-auto">
            Crie sua conta agora e comece a cuidar do seu bem-estar emocional com apoio de uma IA responsável e acolhedora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro">
              <Button size="xl">
                Criar conta gratuita
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline">Já tenho conta</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
