'use client'

interface Props {
  cities: string[]
}

export function MobileCityTabs({ cities }: Props) {
  const scrollToCity = (city: string) => {
    const el = document.getElementById(`city-${city}`)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="block lg:hidden mb-8 -mx-6 px-6 overflow-x-auto">
      <div className="flex gap-2 pb-2 w-max">
        {cities.map(city => (
          <button
            key={city}
            onClick={() => scrollToCity(city)}
            className="flex-shrink-0 text-sm text-mute border border-hairline px-4 py-1.5 rounded-full hover:text-primary hover:border-primary/30 transition-colors whitespace-nowrap"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  )
}
