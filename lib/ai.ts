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
    model: map["AI_MODEL"] || "gemini-2.0-flash",
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

/** Builds user context block */
function buildContextBlock(userContext?: { riskLevel?: string; recentMood?: number; streakDays?: number }): string {
  if (!userContext?.riskLevel) return ""
  const riskLabels: Record<string, string> = {
    STABLE: "Estável", ATTENTION: "Atenção",
    HIGH_RISK: "Alto risco", IMMEDIATE_PRIORITY: "Prioridade imediata",
  }
  let ctx = `\n[Contexto do usuário: nível de bem-estar = ${riskLabels[userContext.riskLevel] || userContext.riskLevel}`
  if (userContext.recentMood) ctx += `, humor recente = ${userContext.recentMood}/10`
  if (userContext.streakDays) ctx += `, sequência = ${userContext.streakDays} dias`
  return ctx + "]"
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
  userContext?: { riskLevel?: string; recentMood?: number; streakDays?: number }
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const [settings, configs] = await Promise.all([getAISettings(), getActiveAIConfigs()])

  if (!settings.enabled) return { success: false, error: "Integração de IA não está ativada." }
  if (!settings.apiKey) return { success: false, error: "Chave de API não configurada." }

  const systemPrompt = buildSystemPrompt(configs) + buildContextBlock(userContext)
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

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testAIConnection(
  apiKey: string, model: string, provider: string
): Promise<{ success: boolean; message: string }> {
  try {
    let text: string
    if (provider === "anthropic") {
      text = await callAnthropic(apiKey, model, "Você é um assistente.", [{ role: "user", content: "Diga apenas: ok" }], 32, 0.1)
    } else if (provider === "gemini") {
      text = await callOpenAICompatible(apiKey, model, "https://generativelanguage.googleapis.com/v1beta/openai", "Você é um assistente.", [{ role: "user", content: "Diga apenas: ok" }], 64, 0.1)
    } else if (provider === "grok") {
      text = await callOpenAICompatible(apiKey, model, "https://api.x.ai/v1", "Você é um assistente.", [{ role: "user", content: "Diga apenas: ok" }], 32, 0.1)
    } else {
      text = await callOpenAICompatible(apiKey, model, "https://api.openai.com/v1", "Você é um assistente.", [{ role: "user", content: "Diga apenas: ok" }], 32, 0.1)
    }
    return { success: true, message: `Conexão OK! Modelo respondeu: "${text.trim()}"` }
  } catch (err: any) {
    return { success: false, message: friendlyAIError(err, provider) }
  }
}
