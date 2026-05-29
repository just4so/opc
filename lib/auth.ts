import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from '@/lib/db'
import { authConfig } from '@/lib/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          username: user.username,
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
        token.username = (user as any).username
        prisma.user.update({ where: { id: user.id as string }, data: { lastActiveAt: new Date() } }).catch(() => {})
      }
      if (trigger === 'signIn' || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: (token.sub ?? token.id) as string },
          select: { showInPlaza: true, username: true },
        })
        if (dbUser) {
          token.showInPlaza = dbUser.showInPlaza
          token.username = dbUser.username
        }
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
        ;(session.user as any).username = token.username
        session.user.image = token.image as string | null
        ;(session.user as any).showInPlaza = token.showInPlaza ?? false
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})
