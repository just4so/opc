'use client'

import { useEffect, useState } from 'react'

interface Props {
  cities: string[]
}

export function CityNav({ cities }: Props) {
  const [activeCity, setActiveCity] = useState<string>(cities[0] || '')

  useEffect(() => {
    if (cities.length === 0) return

    const observers: IntersectionObserver[] = []

    cities.forEach(city => {
      const el = document.getElementById(`city-${city}`)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCity(city)
          }
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [cities])

  const scrollToCity = (city: string) => {
    const el = document.getElementById(`city-${city}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="hidden lg:block w-28 flex-shrink-0 self-stretch relative">
      <div className="sticky top-24">
        <p className="text-[10px] font-medium text-mute tracking-[0.2em] uppercase mb-4 pl-4">城市</p>
        <div className="relative">
          {/* 背景竖线 */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-hairline" />
          <div className="flex flex-col gap-0">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => scrollToCity(city)}
                className={`relative flex items-center text-left text-sm py-2 pl-4 pr-2 transition-all duration-200 ${
                  activeCity === city
                    ? 'text-primary font-medium'
                    : 'text-mute hover:text-ink'
                }`}
              >
                {/* active 橙色短线 */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${
                    activeCity === city ? 'h-5 bg-primary' : 'h-0'
                  }`}
                />
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
