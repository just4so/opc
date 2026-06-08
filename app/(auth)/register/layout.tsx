// Force dynamic rendering to prevent EdgeOne from caching stale RSC payloads
export const dynamic = 'force-dynamic'

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
