import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true }
        })

        if (!user || user.deletedAt) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.status = (user as any).status
        token.theme = (user as any).theme
        token.isMinor = (user as any).isMinor
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
