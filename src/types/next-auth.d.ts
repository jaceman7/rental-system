import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      level: string
      approved: boolean
    }
  }

  interface User {
    role: string
    level: string
    approved: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    level: string
    approved: boolean
  }
}