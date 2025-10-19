import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN'
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // Check password with bcrypt
        if (!user.password) {
          return null
        }
        
        const isValidPassword = await bcrypt.compare(credentials.password, user.password)
        
        if (isValidPassword) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN',
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'USER'
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN'
      }
      return session
    }
  }
}

// Enterprise-level access control
export const requireAuth = (allowedRoles: ('USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN')[] = ['USER']) => {
  return async (req: any, res: any, next: any) => {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    if (!allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    return next()
  }
}

// Super Admin only access (Co-founders)
export const requireSuperAdmin = () => requireAuth(['SUPER_ADMIN'])

// Admin or Super Admin access
export const requireAdmin = () => requireAuth(['ADMIN', 'SUPER_ADMIN'])

// Moderator or higher access
export const requireModerator = () => requireAuth(['MODERATOR', 'ADMIN', 'SUPER_ADMIN'])