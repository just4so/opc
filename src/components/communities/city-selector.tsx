'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CITIES, HOT_CITIES } from '@/constants/cities'

interface CitySelectorProps {
  selectedCity?: string
}

export function CitySelector({ selectedCity }: CitySelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCityChange = (city: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (city) {
      params.set('city', city)
    } else {
      params.delete('city')
    }
    router.push(`/communities?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* 全部城市 */}
      <button
        onClick={() => handleCityChange(null)}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          !selectedCity
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        全部城市
      </button>

      {/* 热门城市 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">热门城市</h3>
        <div className="flex flex-wrap gap-2">
          {HOT_CITIES.map((city) => {
            const cityData = CITIES.find(c => c.name === city)
            return (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-colors',
                  selectedCity === city
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {city}
                {cityData && (
                  <span className="ml-1 text-xs opacity-70">({cityData.count})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 其他城市 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">其他城市</h3>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter(c => !HOT_CITIES.includes(c.name)).map((city) => (
            <button
              key={city.name}
              onClick={() => handleCityChange(city.name)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                selectedCity === city.name
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {city.name}
              <span className="ml-1 text-xs opacity-70">({city.count})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
