'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface FloatingConnectButtonProps {
  slug: string
  communityName: string
  hasContact?: boolean
}

export function FloatingConnectButton({ slug, communityName, hasContact = true }: FloatingConnectButtonProps) {
  const { status } = useSession()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (status === 'loading') return null
  if (status === 'unauthenticated') return null

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 md:hidden transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <Link
        href={`/connect/${slug}`}
        className="flex items-center justify-center w-full px-4 py-3 bg-primary text-on-primary font-medium rounded-xl shadow-lg hover:bg-primary-600 transition-colors text-sm"
      >
        {hasContact ? `🟢 立即申请入驻 ${communityName}` : '🟢 社区直通车 - 立即申请入驻'}
      </Link>
    </div>
  )
}
