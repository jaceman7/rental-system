import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        if (!user.approved) {
          throw new Error('계정이 승인되지 않았습니다. 관리자에게 문의하세요.')
        }

        // 로그인 성공 시 임시 비밀번호 초기화
        if (user.tempPassword) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tempPassword: null,
              tempPasswordCreatedAt: null
            }
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          level: user.level,
          approved: user.approved,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.level = user.level
        token.approved = user.approved
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.level = token.level
        session.user.approved = token.approved
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
}