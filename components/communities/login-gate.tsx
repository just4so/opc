'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoginGateProps {
  isLoggedIn: boolean
  message: string
  registerUrl: string
  children: React.ReactNode
}

export function LoginGate({ isLoggedIn, message, registerUrl, children }: LoginGateProps) {
  if (isLoggedIn) {
    return <>{children}</>
  }

  return (
    <div className="relative min-h-[80px]">
      <div className="blur-sm select-none pointer-events-none min-h-[80px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-lg">
        <Lock className="h-6 w-6 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-3 text-center px-4">{message}</p>
        <Button asChild size="sm">
          <Link href={registerUrl}>立即免费注册</Link>
        </Button>
      </div>
    </div>
  )
}
