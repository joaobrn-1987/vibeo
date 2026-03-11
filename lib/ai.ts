import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"

export interface AISettings {
  enabled: boolean
  apiKey: string
  model: string
  provider: string
}

export interface AIConfig {
  key: string
  value: string
  description: string | null
}

/** Reads AI integration settings from SystemSetting */
export async function getAISettings(): Promise<AISettings> {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["AI_ENABLED", "AI_API_KEY", "AI_MODEL", "AI_PROVIDER"] } },
  })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return {
    enabled: map["AI_ENABLED"] === "true",
    apiKey: map["AI_API_KEY"] || "",
    model: map["AI_MODEL"] || "gemini-2.5-flash-lite",
    provider: map["AI_PROVIDER"] || "gemini",
  }
}

/** Reads active AI configuration rules from AIConfiguration */
export async function getActiveAIConfigs(): Promise<AIConfig[]> {
  const configs = await prisma.aIConfiguration.findMany({
    where: { isActive: true },
    orderBy: { key: "asc" },
  })
  return configs.map((c) => ({ key: c.key, value: c.value, description: c.description }))
}

/** Builds the system prompt by combining all active AIConfiguration entries */
export function buildSystemPrompt(configs: AIConfig[]): string {
  const systemPromptConfig = configs.find((c) => c.key === "SYSTEM_PROMPT")
  const basePrompt = systemPromptConfig?.value ||
    "Você é Vibe, uma assistente virtual acolhedora e empática do Vibeo, uma plataforma de bem-estar emocional para jovens."

  const additionalRules = configs
    .filter((c) => c.key !== "SYSTEM_PROMPT" && c.key !== "MAX_TOKENS" && c.key !== "TEMPERATURE")
    .map((c) => c.value)
    .join("\n\n")

  return additionalRules
    ? `${basePrompt}\n\n---\nRegras adicionais:\n${additionalRules}`
    : basePrompt
}

export interface UserMemory {
  name?: string
  age?: number
  riskLevel?: string
  recentMood?: number
  streakDays?: number
  recentCheckIns?: Array<{
    date: string
    overallMood?: number | null
    energyLevel?: number | null
    anxietyLevel?: number | null
    sleepQuality?: number | null
    dominantFeeling?: string | null
    freeText?: string | null
    riskLevel?: string
  }>
  pastSessionSummaries?: Array<{
    date: string
    userMessages: string[]
    riskLevel?: string
  }>
}

/** Builds user context block for AI system prompt */
function buildContextBlock(memory?: UserMemory): string {
  if (!memory) return ""

  const riskLabels: Record<string, string> = {
    STABLE: "Estável", ATTENTION: "Atenção",
    HIGH_RISK: "Alto risco", IMMEDIATE_PRIORITY: "Prioridade imediata",
  }

  const lines: string[] = []

  // Identity
  if (memory.name) lines.push(`Nome do usuário: ${memory.name}`)
  if (memory.age) lines.push(`Idade: ${memory.age} anos`)

  // Current status
  if (memory.riskLevel) lines.push(`Nível de bem-estar atual: ${riskLabels[memory.riskLevel] || memory.riskLevel}`)
  if (memory.recentMood) lines.push(`Humor mais recente: ${memory.recentMood}/10`)
  if (memory.streakDays) lines.push(`Sequência de check-ins: ${memory.streakDays} dias`)

  // Recent check-ins
  if (memory.recentCheckIns && memory.recentCheckIns.length > 0) {
    lines.push("\nHistórico de check-ins recentes:")
    for (const c of memory.recentCheckIns) {
      const parts: string[] = [`  • ${c.date}:`]
      if (c.overallMood) parts.push(`humor ${c.overallMood}/10`)
      if (c.energyLevel) parts.push(`energia ${c.energyLevel}/10`)
      if (c.anxietyLevel) parts.push(`ansiedade ${c.anxietyLevel}/10`)
      if (c.sleepQuality) parts.push(`sono ${c.sleepQuality}/10`)
      if (c.dominantFeeling) parts.push(`sentimento: ${c.dominantFeeling}`)
      if (c.riskLevel && c.riskLevel !== "STABLE") parts.push(`risco: ${riskLabels[c.riskLevel] || c.riskLevel}`)
      lines.push(parts.join(", "))
      if (c.freeText) lines.push(`    Nota: "${c.freeText.slice(0, 200)}"`)
    }
  }

  // Past conversations
  if (memory.pastSessionSummaries && memory.pastSessionSummaries.length > 0) {
    lines.push("\nConversas anteriores com Vibe:")
    for (const s of memory.pastSessionSummaries) {
      lines.push(`  • ${s.date}${s.riskLevel && s.riskLevel !== "STABLE" ? ` [${riskLabels[s.riskLevel] || s.riskLevel}]` : ""}:`)
      for (const msg of s.userMessages.slice(0, 4)) {
        lines.push(`    - "${msg.slice(0, 150)}"`)
      }
    }
  }

  if (lines.length === 0) return ""
  return `\n\n[Memória e contexto do usuário]\n${lines.join("\n")}\n[Fim do contexto]`
}

// ─── Simple rate limiter (15 RPM = 1 req per 4s for Gemini free tier) ─────────

const rateLimiter = {
  lastCallAt: 0,
  minIntervalMs: 4100, // slightly above 4s to stay safely under 15 RPM
  async throttle() {
    const now = Date.now()
    const wait = this.minIntervalMs - (now - this.lastCallAt)
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
    this.lastCallAt = Date.now()
  },
}

// ─── Provider implementations ────────────────────────────────────────────────

async function callAnthropic(
  apiKey: string, model: string, systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number, temperature: number
): Promise<string> {
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({ model, max_tokens: maxTokens, temperature, system: systemPrompt, messages })
  const content = response.content[0]
  if (content.type === "text") return content.text
  throw new Error("Resposta inesperada da API Anthropic.")
}

async function callOpenAICompatible(
  apiKey: string, model: string, baseUrl: string, systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number, temperature: number,
  retries = 3
): Promise<string> {
  const body = {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  }
  const providerName = baseUrl.includes("x.ai") ? "grok" : baseUrl.includes("googleapis") ? "gemini" : "openai"

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })

    if (res.status === 429 && attempt < retries) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "0") * 1000
      const backoff = retryAfter || Math.pow(2, attempt + 1) * 1000
      console.warn(`AI rate limit (429), retry ${attempt + 1}/${retries} after ${backoff}ms`)
      await new Promise((resolve) => setTimeout(resolve, backoff))
      continue
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const errMsg = errData?.error?.message || `HTTP ${res.status}`
      throw Object.assign(new Error(errMsg), { status: res.status, provider: providerName, errorData: errData })
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error("Resposta inesperada da API.")
    return text
  }

  throw Object.assign(new Error("HTTP 429"), { status: 429, provider: providerName, errorData: {} })
}

// ─── Main send function ───────────────────────────────────────────────────────

/** Sends a message to the AI and returns the response */
export async function sendToAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMemory?: UserMemory
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const [settings, configs] = await Promise.all([getAISettings(), getActiveAIConfigs()])

  if (!settings.enabled) return { success: false, error: "Integração de IA não está ativada." }
  if (!settings.apiKey) return { success: false, error: "Chave de API não configurada." }

  const systemPrompt = buildSystemPrompt(configs) + buildContextBlock(userMemory)
  const maxTokens = parseInt(configs.find((c) => c.key === "MAX_TOKENS")?.value || "1024") || 1024
  const temperature = parseFloat(configs.find((c) => c.key === "TEMPERATURE")?.value || "0.7") || 0.7

  try {
    let text: string
    if (settings.provider === "anthropic") {
      text = await callAnthropic(settings.apiKey, settings.model, systemPrompt, messages, maxTokens, temperature)
    } else if (settings.provider === "gemini") {
      await rateLimiter.throttle()
      text = await callOpenAICompatible(settings.apiKey, settings.model, "https://generativelanguage.googleapis.com/v1beta/openai", systemPrompt, messages, maxTokens, temperature)
    } else if (settings.provider === "grok") {
      text = await callOpenAICompatible(settings.apiKey, settings.model, "https://api.x.ai/v1", systemPrompt, messages, maxTokens, temperature)
    } else {
      text = await callOpenAICompatible(settings.apiKey, settings.model, "https://api.openai.com/v1", systemPrompt, messages, maxTokens, temperature)
    }
    return { success: true, content: text }
  } catch (err: any) {
    console.error("AI error:", err)
    return { success: false, error: friendlyAIError(err, settings.provider) }
  }
}

// ─── Error handling ───────────────────────────────────────────────────────────

function friendlyAIError(err: any, provider = "gemini"): string {
  const msg: string = err?.message || err?.errorData?.error?.message || err?.errorData?.error?.status || ""
  const status: number = err?.status || 0
  console.error("AI error detail:", { status, msg, provider, errorData: err?.errorData })

  if (msg.includes("credit balance is too low") || msg.includes("insufficient_quota")) {
    return provider === "anthropic"
      ? "Saldo insuficiente na conta Anthropic. Adicione créditos em console.anthropic.com/settings/billing."
      : "Saldo insuficiente. Verifique o plano da sua conta."
  }
  if (status === 401 || status === 403 || msg.includes("invalid x-api-key") || msg.includes("authentication_error") || msg.includes("Incorrect API key") || msg.includes("Unauthorized") || msg.includes("Forbidden")) {
    const providerName = provider === "grok" ? "xAI (console.x.ai)" : provider === "anthropic" ? "Anthropic" : "OpenAI"
    return `Acesso negado (${status || "403"}). Verifique se a chave é válida e tem permissão para o modelo selecionado. Obtenha a chave em ${providerName}.`
  }
  if (status === 429 || msg.includes("rate_limit") || msg.includes("Rate limit")) {
    return "Limite de requisições atingido. Tente novamente em alguns instantes."
  }
  if (status === 400) {
    if (msg.includes("credit")) return "Saldo insuficiente. Verifique o plano da sua conta."
    if (msg.includes("model")) return `Modelo inválido ou não disponível no seu plano. Selecione outro modelo.`
    return msg ? `Erro 400: ${msg}` : "Requisição inválida (400). Verifique o modelo e a chave de API."
  }
  return msg || "Erro ao comunicar com a IA."
}

// ─── Chat risk assessment ─────────────────────────────────────────────────────

const RISK_KEYWORDS = {
  IMMEDIATE_PRIORITY: [
    "me matar", "quero morrer", "vou me matar", "suicídio", "suicidar",
    "acabar com tudo", "tirar minha vida", "não quero mais viver", "me suicidar",
    "quero me matar", "pensar em suicídio", "tentativa de suicídio",
  ],
  HIGH_RISK: [
    "me machucar", "me ferir", "automutilação", "cortar o pulso", "cortar meu",
    "não aguento mais", "quero desaparecer", "pensamentos de morte", "morrer",
    "sem motivo para viver", "ninguém vai sentir minha falta", "não tem saída",
  ],
  ATTENTION: [
    "muito triste", "desesperado", "sem esperança", "deprimido", "muito ansioso",
    "ataque de pânico", "sem saída", "não consigo dormir", "chorando muito",
    "me sinto péssimo", "me sinto horrível", "completamente perdido",
  ],
}

export function assessChatRisk(userMessages: string[]): { riskLevel: string; flags: string[] } {
  const text = userMessages.join(" ").toLowerCase()
  const flags: string[] = []

  for (const kw of RISK_KEYWORDS.IMMEDIATE_PRIORITY) {
    if (text.includes(kw)) flags.push(kw)
  }
  if (flags.length > 0) return { riskLevel: "IMMEDIATE_PRIORITY", flags }

  for (const kw of RISK_KEYWORDS.HIGH_RISK) {
    if (text.includes(kw)) flags.push(kw)
  }
  if (flags.length > 0) return { riskLevel: "HIGH_RISK", flags }

  for (const kw of RISK_KEYWORDS.ATTENTION) {
    if (text.includes(kw)) flags.push(kw)
  }
  if (flags.length > 0) return { riskLevel: "ATTENTION", flags }

  return { riskLevel: "STABLE", flags: [] }
}

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testAIConnection(
  apiKey: string, model: string, provider: string
): Promise<{ success: boolean; message: string; actualModel?: string }> {
  try {
    if (provider === "anthropic") {
      const text = await callAnthropic(apiKey, model, "Você é um assistente.", [{ role: "user", content: "Diga apenas: ok" }], 32, 0.1)
      return { success: true, message: `Conexão OK! Modelo respondeu: "${text.trim()}"`, actualModel: model }
    }

    // For OpenAI-compatible providers, capture the actual model from the response
    const baseUrl =
      provider === "gemini" ? "https://generativelanguage.googleapis.com/v1beta/openai"
      : provider === "grok" ? "https://api.x.ai/v1"
      : "https://api.openai.com/v1"

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 64,
        temperature: 0.1,
        messages: [
          { role: "system", content: "Você é um assistente." },
          { role: "user", content: "Diga apenas: ok" },
        ],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`
      throw Object.assign(new Error(errMsg), { status: res.status, provider, errorData: data })
    }

    const text = data?.choices?.[0]?.message?.content || ""
    const actualModel: string = data?.model || model

    return { success: true, message: `Conexão OK! Modelo respondeu: "${text.trim()}"`, actualModel }
  } catch (err: any) {
    return { success: false, message: friendlyAIError(err, provider) }
  }
}
