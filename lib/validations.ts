import { z } from 'zod'

export const emailSchema = z.string().email().max(254).trim().toLowerCase()

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve ter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve ter pelo menos um número')

export const nameSchema = z.string().min(2).max(100).trim()

export const freeTextSchema = z
  .string()
  .max(2000)
  .trim()
  .transform(s => s.replace(/<[^>]*>/g, '')) // strip HTML tags

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
  age: z.number().int().min(0).max(120),
  isMinor: z.boolean(),
  theme: z.enum(['FEMININE', 'MASCULINE', 'DIVERSITY']).default('FEMININE'),
  guardianName: z.string().min(2).max(100).optional(),
  guardianEmail: emailSchema.optional().or(z.literal('')).optional(),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
})

export const checkInSchema = z.object({
  overallMood: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  anxietyLevel: z.number().int().min(1).max(10),
  sleepQuality: z.number().int().min(1).max(10),
  irritability: z.number().int().min(1).max(10).optional(),
  motivation: z.number().int().min(1).max(10).optional(),
  appetite: z.number().int().min(1).max(10).optional(),
  dominantFeeling: z.string().max(100).optional(),
  freeText: freeTextSchema.optional(),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const themeSchema = z.object({
  theme: z.enum(['FEMININE', 'MASCULINE', 'DIVERSITY']),
})

// Validate a string looks like a Prisma cuid
export function isValidCuid(id: string): boolean {
  return /^c[a-z0-9]{24,}$/.test(id)
}
