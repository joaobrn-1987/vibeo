import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears } from "date-fns"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: Date): number {
  return differenceInYears(new Date(), birthDate)
}

export function isMinor(birthDate: Date): boolean {
  return calculateAge(birthDate) < 18
}

const DEFAULT_TZ = process.env.TZ || 'America/Sao_Paulo'

export function formatDate(date: Date | string, fmt: string = "dd/MM/yyyy", tz: string = DEFAULT_TZ): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (fmt === "dd/MM/yyyy") {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
  }
  if (fmt === "dd/MM/yyyy HH:mm") {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d)
  }
  if (fmt === "HH:mm") {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(d)
  }
  if (fmt === "EEEE, dd/MM/yyyy") {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
  }
  if (fmt === "EEEE, dd/MM/yyyy HH:mm") {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d)
  }
  // fallback genérico
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, dateStyle: "short" }).format(d)
}

export function formatRelative(date: Date | string, tz: string = DEFAULT_TZ): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "agora mesmo"
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? "s" : ""}`
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`
  if (diffDays === 1) return "ontem"
  if (diffDays < 7) return `há ${diffDays} dias`
  return formatDate(d, "dd/MM/yyyy", tz)
}

export function generateToken(length: number = 32): string {
  // Use cryptographically secure random bytes, encode as hex
  // Each byte becomes 2 hex chars, so we need length/2 bytes to get `length` hex chars
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

export function getRiskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    STABLE: 'Estável',
    ATTENTION: 'Atenção',
    HIGH_RISK: 'Risco Elevado',
    IMMEDIATE_PRIORITY: 'Prioridade Imediata',
  }
  return labels[level] || level
}

export function getRiskLevelColor(level: string): string {
  const colors: Record<string, string> = {
    STABLE: 'text-green-600 bg-green-50 border-green-200',
    ATTENTION: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    HIGH_RISK: 'text-orange-600 bg-orange-50 border-orange-200',
    IMMEDIATE_PRIORITY: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[level] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getThemeLabel(theme: string): string {
  const labels: Record<string, string> = {
    FEMININE: 'Feminino',
    MASCULINE: 'Masculino',
    DIVERSITY: 'Diversidade',
  }
  return labels[theme] || theme
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
