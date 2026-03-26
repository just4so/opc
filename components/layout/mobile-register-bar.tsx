"use client"
import Link from "next/link"
import { Lock } from "lucide-react"

interface MobileRegisterBarProps {
  registerUrl?: string
  isLoggedIn: boolean
}

export function MobileRegisterBar({ registerUrl = "/register", isLoggedIn }: MobileRegisterBarProps) {
  if (isLoggedIn) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="h-4 w-4 text-primary" />
          <span>注册后查看完整社区攻略</span>
        </div>
        <Link
          href={registerUrl}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
        >
          免费注册
        </Link>
      </div>
    </div>
  )
}
