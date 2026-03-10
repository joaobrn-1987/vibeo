import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// In-memory rate limiting: track failed login attempts per email
// Structure: email -> { count: number, firstAttempt: number }
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(email)
  if (!record) return false
  // Reset window if it has expired
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(email)
    return false
  }
  return record.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(email: string): void {
  const now = Date.now()
  const record = loginAttempts.get(email)
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(email, { count: 1, firstAttempt: now })
  } else {
    record.count += 1
  }
}

function clearAttempts(email: string): void {
  loginAttempts.delete(email)
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()

        // Rate limiting check
        if (isRateLimited(email)) {
          throw new Error('TOO_MANY_ATTEMPTS')
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: true }
        })

        // Use constant-time comparison even when user doesn't exist to prevent timing attacks
        const dummyHash = '$2a$12$dummyhashfordummycomparisononlyXXXXXXXXXXXXXXXXXXXXXXXXX'
        const hashToCompare = user?.passwordHash ?? dummyHash

        const isValid = await bcrypt.compare(credentials.password, hashToCompare)

        if (!user || user.deletedAt || !isValid) {
          recordFailedAttempt(email)
          return null
        }

        // Clear failed attempts on successful password match
        clearAttempts(email)

        if (user.status === 'PENDING_EMAIL') {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        if (user.status === 'PENDING_CONSENT') {
          throw new Error('CONSENT_PENDING')
        }

        if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
          throw new Error('ACCOUNT_INACTIVE')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastActiveAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.fullName || '',
          role: user.role,
          status: user.status,
          theme: user.profile?.theme || 'FEMININE',
          isMinor: user.isMinor,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.status = (user as any).status
        token.theme = (user as any).theme
        token.isMinor = (user as any).isMinor
      }
      if (trigger === 'update' && session?.theme) {
        token.theme = session.theme
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.theme = token.theme as string
        session.user.isMinor = token.isMinor as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
