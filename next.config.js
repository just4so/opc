const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true, // 开启 gzip/brotli 压缩
  async headers() {
    return [
      {
        // Static assets with content hash: cache forever (immutable)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // 社区列表：force-static，内容稳定，浏览器可缓存 5 分钟
        source: '/communities',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=600' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // data/faq：revalidate=3600/86400，内容极稳定
        source: '/(data|faq)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=3600' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // news/plaza：revalidate=600/300，内容更新较频繁
        source: '/(news|plaza)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=60' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // 首页：revalidate=600
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=60' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // 其他页面：动态（auth/profile/admin/社区详情等），不缓存
        source: '/((?!_next/static|communities|data|faq|news|plaza).+)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/market',
        destination: '/plaza',
        permanent: true,
      },
      {
        source: '/market/:path*',
        destination: '/plaza',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-413b408ff02649388d393e4ff152b22e.r2.dev',
      },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: 'opcquan',
  project: 'opcquan',

  // source map 上传（暂时禁用，减少 build 内存占用）
  // authToken: process.env.SENTRY_AUTH_TOKEN,
  // sourcemaps: { deleteSourcemapsAfterUpload: true },

  // 减少构建日志噪音
  silent: !process.env.CI,

  // 不自动添加 Sentry 路由跟踪（减少 bundle size）
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
  autoInstrumentAppDirectory: true,
})
