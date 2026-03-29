import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe auth config（无 Prisma，给 middleware 专用）
 * 只做 JWT 验证，不碰数据库
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth }) {
      // 有 token 即视为已登录，具体权限校验在 API 层做
      return !!auth
    },
  },
}
