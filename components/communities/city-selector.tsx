'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { HOT_CITIES } from '@/constants/cities'

interface CitySelectorProps {
  selectedCity?: string
  cityCounts: { city: string; count: number }[]
}

export function CitySelector({ selectedCity, cityCounts }: CitySelectorProps) {
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

  // 从 cityCounts 获取城市数量
  const getCount = (cityName: string) => {
    const found = cityCounts.find((c) => c.city === cityName)
    return found?.count || 0
  }

  // 热门城市（按 HOT_CITIES 排序，仅显示有数据的）
  const hotCities = HOT_CITIES.filter((city) => getCount(city) > 0)

  // 其他城市（按数量降序排列）
  const otherCities = cityCounts
    .filter((c) => !HOT_CITIES.includes(c.city))
    .sort((a, b) => b.count - a.count)

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
      {hotCities.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">热门城市</h3>
          <div className="flex flex-wrap gap-2">
            {hotCities.map((city) => (
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
                <span className="ml-1 text-xs opacity-70">({getCount(city)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 其他城市 */}
      {otherCities.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">其他城市</h3>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((city) => (
              <button
                key={city.city}
                onClick={() => handleCityChange(city.city)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-colors',
                  selectedCity === city.city
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {city.city}
                <span className="ml-1 text-xs opacity-70">({city.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
