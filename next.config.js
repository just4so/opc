/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve static assets from R2 CDN to bypass EdgeOne opennextjs-pages
  // routing bug that 404s on multi-level paths under chunks/app/.
  // Post-build script (upload-static-to-r2.mjs) syncs .next/static/ to R2.
  assetPrefix: 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev',
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
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
  },
}

module.exports = nextConfig
