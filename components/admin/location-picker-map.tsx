'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CITY_COORDINATES } from '@/constants/cities'
import { MapPin } from 'lucide-react'

declare global {
  interface Window {
    BMapGL: any
    initBMapPicker: () => void
  }
}

interface LocationPickerMapProps {
  city: string
  latitude?: number | null
  longitude?: number | null
  onLocationChange: (location: { latitude: number; longitude: number }) => void
}

export function LocationPickerMap({
  city,
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const ak = process.env.NEXT_PUBLIC_BMAP_KEY

    if (window.BMapGL) {
      setIsLoaded(true)
      return
    }

    window.initBMapPicker = () => {
      setIsLoaded(true)
    }

    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${ak}&callback=initBMapPicker`
    script.async = true
    document.head.appendChild(script)
  }, [])

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.BMapGL) return

    const BMapGL = window.BMapGL

    const map = new BMapGL.Map(mapRef.current)
    mapInstanceRef.current = map

    let point: any
    if (latitude && longitude) {
      point = new BMapGL.Point(longitude, latitude)
    } else if (CITY_COORDINATES[city]) {
      const coords = CITY_COORDINATES[city]
      point = new BMapGL.Point(coords.lng, coords.lat)
    } else {
      point = new BMapGL.Point(116.404, 39.915)
    }

    map.centerAndZoom(point, 14)
    map.enableScrollWheelZoom(true)

    // Add initial marker if coordinates exist
    if (latitude && longitude) {
      const marker = new BMapGL.Marker(point)
      map.addOverlay(marker)
      markerRef.current = marker
    }

    // Click event for picking location
    map.addEventListener('click', (e: any) => {
      const clickPoint = e.latlng

      // Remove old marker
      if (markerRef.current) {
        map.removeOverlay(markerRef.current)
      }

      // Add new marker
      const marker = new BMapGL.Marker(clickPoint)
      map.addOverlay(marker)
      markerRef.current = marker

      // Callback with new coordinates
      onLocationChange({
        latitude: clickPoint.lat,
        longitude: clickPoint.lng,
      })
    })
  }, [city, latitude, longitude, onLocationChange])

  useEffect(() => {
    if (isLoaded) {
      initMap()
    }
  }, [isLoaded, initMap])

  // Update map center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.BMapGL) return

    const BMapGL = window.BMapGL
    if (CITY_COORDINATES[city]) {
      const coords = CITY_COORDINATES[city]
      const point = new BMapGL.Point(coords.lng, coords.lat)
      mapInstanceRef.current.centerAndZoom(point, 14)
    }
  }, [city])

  return (
    <div className="space-y-2">
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        <div ref={mapRef} className="w-full h-full" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-gray-500 text-sm">地图加载中...</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <MapPin className="h-4 w-4 text-primary" />
        {latitude && longitude ? (
          <span>
            经度: {longitude.toFixed(6)}, 纬度: {latitude.toFixed(6)}
          </span>
        ) : (
          <span className="text-gray-400">点击地图选择位置</span>
        )}
      </div>
    </div>
  )
}
