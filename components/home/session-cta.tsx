'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

export function HeroSessionLink() {
  const { data: session } = useSession()
  return (
    <Link
      href={session ? "/plaza" : "/start"}
      className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-medium text-secondary hover:border-primary hover:text-primary transition-all"
    >
      {session ? '进入广场' : '免费加入'}
    </Link>
  )
}

export function CtaSessionLink() {
  const { data: session } = useSession()
  return (
    <Link
      href={session ? "/plaza" : "/start"}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-medium text-secondary hover:bg-gray-100 transition-colors"
    >
      {session ? '进入创业广场' : '免费注册'}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
