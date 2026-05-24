'use client'
import { useEffect, useState, ReactNode } from 'react'

export function ScrollHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    if (prefersReduced) {
      document.documentElement.style.setProperty('--nav-transition', 'none')
    }
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-[background-color,border-color] duration-300 ${
        scrolled
          ? 'glass-nav border-b border-hairline-soft'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {children}
    </header>
  )
}
