'use client'

import Link from 'next/link'

interface FloatingConnectButtonProps {
  slug: string
  communityName: string
}

export function FloatingConnectButton({ slug, communityName }: FloatingConnectButtonProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Link
        href={`/connect/${slug}`}
        className="flex items-center justify-center w-full px-4 py-3 bg-primary text-on-primary font-medium rounded-xl shadow-lg hover:bg-primary-600 transition-colors text-sm"
      >
        🟢 快速对接 {communityName}
      </Link>
    </div>
  )
}
