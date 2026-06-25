'use client'

import { useState, useEffect } from 'react'

interface TocItem {
  id: string
  label: string
}

export function SignalToc({ sections }: { sections: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <div className="sticky top-24 hidden xl:block w-48 flex-shrink-0">
      <div className="text-xs font-semibold text-ash uppercase tracking-wide mb-2">目录</div>
      <ul className="space-y-0.5">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <button
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className={`text-left w-full text-sm py-1 transition-colors ${
                activeId === id
                  ? 'text-primary font-medium'
                  : 'text-mute hover:text-ink cursor-pointer'
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
