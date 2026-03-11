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
    model: map["AI_MODEL"] || "claude-haiku-4-5-20251001",
    provider: map["AI_PROVIDER"] || "anthropic",
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

/** Sends a message to the AI and returns the response */
export async function sendToAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userContext?: {
    riskLevel?: string
    recentMood?: number
    streakDays?: number
  }
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const [settings, configs] = await Promise.all([getAISettings(), getActiveAIConfigs()])

  if (!settings.enabled) {
    return { success: false, error: "Integração de IA não está ativada." }
  }
  if (!settings.apiKey) {
    return { success: false, error: "Chave de API não configurada." }
  }

  const systemPrompt = buildSystemPrompt(configs)
  const maxTokensConfig = configs.find((c) => c.key === "MAX_TOKENS")
  const temperatureConfig = configs.find((c) => c.key === "TEMPERATURE")
  const maxTokens = maxTokensConfig ? parseInt(maxTokensConfig.value) || 1024 : 1024
  const temperature = temperatureConfig ? parseFloat(temperatureConfig.value) || 0.7 : 0.7

  // Build context block if provided
  let contextBlock = ""
  if (userContext?.riskLevel) {
    const riskLabels: Record<string, string> = {
      STABLE: "Estável", ATTENTION: "Atenção",
      HIGH_RISK: "Alto risco", IMMEDIATE_PRIORITY: "Prioridade imediata",
    }
    contextBlock += `\n[Contexto do usuário: nível de bem-estar = ${riskLabels[userContext.riskLevel] || userContext.riskLevel}`
    if (userContext.recentMood) contextBlock += `, humor recente = ${userContext.recentMood}/10`
    if (userContext.streakDays) contextBlock += `, sequência = ${userContext.streakDays} dias`
    contextBlock += `]`
  }

  try {
    const client = new Anthropic({ apiKey: settings.apiKey })

    const response = await client.messages.create({
      model: settings.model,
      max_tokens: maxTokens,
      temperature,
      system: contextBlock ? systemPrompt + contextBlock : systemPrompt,
      messages,
    })

    const content = response.content[0]
    if (content.type === "text") {
      return { success: true, content: content.text }
    }
    return { success: false, error: "Resposta inesperada da IA." }
  } catch (err: any) {
    console.error("AI error:", err)
    return { success: false, error: friendlyAIError(err) }
  }
}

function friendlyAIError(err: any): string {
  const msg: string = err?.message || err?.error?.message || ""
  if (msg.includes("credit balance is too low") || msg.includes("insufficient_quota")) {
    return "Saldo insuficiente na conta Anthropic. Adicione créditos em console.anthropic.com/settings/billing."
  }
  if (msg.includes("invalid x-api-key") || msg.includes("authentication_error") || err?.status === 401) {
    return "Chave de API inválida. Verifique a chave em Configurações › Integração de IA."
  }
  if (msg.includes("rate_limit") || err?.status === 429) {
    return "Limite de requisições atingido. Tente novamente em alguns instantes."
  }
  if (err?.status === 400) {
    const detail = err?.error?.message || msg
    if (detail.includes("credit")) {
      return "Saldo insuficiente na conta Anthropic. Adicione créditos em console.anthropic.com/settings/billing."
    }
  }
  return msg || "Erro ao comunicar com a IA."
}

/** Tests the AI connection with a simple message */
export async function testAIConnection(apiKey: string, model: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model,
      max_tokens: 32,
      messages: [{ role: "user", content: "Diga apenas: ok" }],
    })
    const content = response.content[0]
    if (content.type === "text") {
      return { success: true, message: `Conexão OK! Modelo respondeu: "${content.text.trim()}"` }
    }
    return { success: false, message: "Resposta inesperada da API." }
  } catch (err: any) {
    return { success: false, message: friendlyAIError(err) }
  }
}
