import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        // 复用 email 字段传手机号或邮箱（NextAuth credentials key 不影响实际逻辑）
        email: { label: '手机号或邮箱', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入手机号/邮箱和密码')
        }

        const identifier = (credentials.email as string).trim()

        // 判断是手机号还是邮箱
        const isPhone = /^1[3-9]\d{9}$/.test(identifier)

        const user = await prisma.user.findFirst({
          where: isPhone
            ? { phone: identifier }
            : { email: identifier },
        })

        if (!user || !user.passwordHash) {
          throw new Error('账号不存在')
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('密码错误')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.username,
          image: user.avatar,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.image = (user as any).image
      }
      if (trigger === 'update' && updateData) {
        if (updateData.name !== undefined) token.name = updateData.name
        if (updateData.image !== undefined) token.image = updateData.image
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        session.user.image = token.image as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
