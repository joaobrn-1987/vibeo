"use client"
import { useState, useRef, useEffect } from "react"
import { Send, Loader2, MessageCircle, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatClientProps {
  aiEnabled: boolean
  displayName: string
}

export function ChatClient({ aiEnabled, displayName }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (!res.ok || !data.content) {
        setError(data.error || "Erro ao conectar com a Vibe.")
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.content }])
      }
    } catch {
      setError("Erro de rede. Verifique sua conexão.")
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!aiEnabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-foreground">Chat com Vibe</h1>
          <p className="text-sm text-foreground/50 mt-1">Sua assistente virtual de bem-estar.</p>
        </div>
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-foreground/30" />
          </div>
          <h2 className="font-semibold text-foreground mb-2">Chat não disponível</h2>
          <p className="text-sm text-foreground/50">
            A integração com IA não está ativada no momento. Entre em contato com o administrador.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="font-display font-bold text-2xl text-foreground">Chat com Vibe</h1>
        <p className="text-sm text-foreground/50 mt-1">Sua assistente virtual de bem-estar.</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-lg">Olá, {displayName}! 👋</h2>
              <p className="text-sm text-foreground/50 mt-1 max-w-sm">
                Sou a Vibe, sua assistente de bem-estar emocional. Estou aqui para ouvir e ajudar. Como você está se sentindo hoje?
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {["Como estou me sentindo hoje", "Preciso de ajuda para relaxar", "Me sinto ansioso(a)", "Quero conversar"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full border border-primary-200 hover:bg-primary-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-primary-400 to-accent-400"
                : "bg-cream-200"
            }`}>
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-foreground/60" />
              )}
            </div>
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-white border border-cream-200 text-foreground rounded-tl-sm"
                : "bg-primary-500 text-white rounded-tr-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 bg-white border border-cream-200 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 inline-block">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 flex gap-2 items-end bg-white border border-cream-200 rounded-2xl p-2 shadow-sm">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem… (Enter para enviar)"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none px-2 py-2 max-h-32 overflow-y-auto"
          style={{ minHeight: "2.5rem" }}
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="rounded-xl h-9 w-9 p-0 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-center text-[10px] text-foreground/30 mt-2">
        Em emergências: CVV 188 | SAMU 192
      </p>
    </div>
  )
}
