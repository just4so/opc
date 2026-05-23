'use client'

import Link from 'next/link'

interface FloatingConnectButtonProps {
  slug: string
  communityName: string
  hasContact?: boolean
}

export function FloatingConnectButton({ slug, communityName, hasContact = true }: FloatingConnectButtonProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Link
        href={`/connect/${slug}`}
        className="flex items-center justify-center w-full px-4 py-3 bg-primary text-on-primary font-medium rounded-xl shadow-lg hover:bg-primary-600 transition-colors text-sm"
      >
        {hasContact ? `🟢 快速对接 ${communityName}` : '🟢 提交意向，专人帮你对接'}
      </Link>
    </div>
  )
}
