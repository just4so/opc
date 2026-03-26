'use client'

import { useEffect, useRef, useState } from 'react'
import { CITY_COORDINATES } from '@/constants/cities'

declare global {
  interface Window {
    BMapGL: any
    initBMap: () => void
  }
}

interface CommunityLocationMapProps {
  name: string
  city: string
  address: string
  latitude?: number | null
  longitude?: number | null
}

export function CommunityLocationMap({
  name,
  city,
  address,
  latitude,
  longitude,
}: CommunityLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const ak = process.env.NEXT_PUBLIC_BMAP_KEY

    if (window.BMapGL) {
      setIsLoaded(true)
      return
    }

    window.initBMap = () => {
      setIsLoaded(true)
    }

    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${ak}&callback=initBMap`
    script.async = true
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.BMapGL) return

    const BMapGL = window.BMapGL

    const map = new BMapGL.Map(mapRef.current)

    let point: any

    if (latitude && longitude) {
      point = new BMapGL.Point(longitude, latitude)
    } else if (CITY_COORDINATES[city]) {
      const coords = CITY_COORDINATES[city]
      point = new BMapGL.Point(coords.lng, coords.lat)
    } else {
      point = new BMapGL.Point(116.404, 39.915)
    }

    map.centerAndZoom(point, 15)
    map.enableScrollWheelZoom(true)

    // Add marker
    const marker = new BMapGL.Marker(point)
    map.addOverlay(marker)

    // Add info window
    const infoWindow = new BMapGL.InfoWindow(
      `<div style="padding: 4px;">
        <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600;">${name}</h4>
        <p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
      </div>`,
      { width: 220, height: 80 }
    )

    marker.addEventListener('click', () => {
      map.openInfoWindow(infoWindow, point)
    })

  }, [isLoaded, name, city, address, latitude, longitude])

  return (
    <div className="relative w-full h-[200px] rounded-lg overflow-hidden bg-gray-100">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500 text-sm">地图加载中...</div>
        </div>
      )}
    </div>
  )
}
