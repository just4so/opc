/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true, // 开启 gzip/brotli 压缩
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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

module.exports = nextConfig
