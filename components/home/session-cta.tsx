'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

export function HeroSessionLink() {
  const { data: session } = useSession()
  return (
    <Link
      href={session ? "/plaza" : "/register"}
      className="inline-flex items-center justify-center rounded-xl border-2 border-hairline-soft bg-canvas px-8 py-4 text-base font-medium text-ink hover:border-primary hover:text-primary transition-all"
    >
      {session ? '进入广场' : '免费加入'}
    </Link>
  )
}

export function CtaSessionLink() {
  const { data: session } = useSession()
  return (
    <Link
      href={session ? "/plaza" : "/register"}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-canvas px-8 py-4 text-base font-medium text-ink hover:bg-surface-card transition-colors"
    >
      {session ? '进入创业广场' : '免费注册'}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

export function HeroCardLink() {
  const { data: session } = useSession()
  return (
    <Link
      href={session?.user ? '/settings#card' : '/register'}
      className="btn-press bg-transparent border-[1.5px] border-hairline text-ink rounded-xl px-9 py-3.5 font-semibold hover:bg-surface-soft transition-all"
    >
      让世界看见我
    </Link>
  )
}
