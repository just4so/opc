'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedProgressProps {
  value: number
  className?: string
}

export function AnimatedProgress({ value, className = '' }: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setWidth(value)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWidth(value)
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} className={`w-full rounded-full h-2 bg-[#e5e5e0] ${className}`}>
      <div
        className="rounded-full h-2"
        style={{
          width: `${width}%`,
          backgroundColor: '#F97316',
          transition: 'width 800ms ease-out',
        }}
      />
    </div>
  )
}
