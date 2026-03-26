'use client'

import { useEffect, useRef, useState } from 'react'
import { CITY_COORDINATES } from '@/constants/cities'

declare global {
  interface Window {
    BMapGL: any
    initBMap: () => void
  }
}

interface Community {
  id: string
  slug: string
  name: string
  city: string
  address: string
  latitude?: number
  longitude?: number
}

interface BaiduMapProps {
  communities: Community[]
  onMarkerClick?: (community: Community) => void
  selectedCity?: string
}

export function BaiduMap({ communities, onMarkerClick, selectedCity }: BaiduMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // 加载百度地图脚本
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

    return () => {
      // 清理
    }
  }, [])

  // 初始化地图（只跑一次）
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.BMapGL) return

    const BMapGL = window.BMapGL
    const map = new BMapGL.Map(mapRef.current)

    const center = new BMapGL.Point(104.5, 35.5) // 中国地理中心，全国视野
    map.centerAndZoom(center, 5)
    map.enableScrollWheelZoom(true)

    setMapInstance(map)
  }, [isLoaded])

  // 城市切换时重新 zoom
  useEffect(() => {
    if (!mapInstance || !window.BMapGL) return
    const BMapGL = window.BMapGL
    if (selectedCity && CITY_COORDINATES[selectedCity]) {
      const coords = CITY_COORDINATES[selectedCity]
      mapInstance.panTo(new BMapGL.Point(coords.lng, coords.lat))
      mapInstance.setZoom(11)
    } else if (!selectedCity) {
      mapInstance.panTo(new BMapGL.Point(104.5, 35.5))
      mapInstance.setZoom(5)
    }
  }, [mapInstance, selectedCity])

  // 添加标记点
  useEffect(() => {
    if (!mapInstance || !window.BMapGL) return

    const BMapGL = window.BMapGL

    // 清除现有标记
    mapInstance.clearOverlays()

    // 添加社区标记
    communities.forEach((community) => {
      let point: any

      if (community.latitude && community.longitude) {
        point = new BMapGL.Point(community.longitude, community.latitude)
      } else if (CITY_COORDINATES[community.city]) {
        // 如果没有精确坐标，使用城市中心点
        const coords = CITY_COORDINATES[community.city]
        point = new BMapGL.Point(coords.lng, coords.lat)
      } else {
        return
      }

      const marker = new BMapGL.Marker(point, {
        icon: new BMapGL.Icon(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
              <defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/></filter></defs>
              <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z" fill="#F97316" filter="url(#shadow)"/>
              <circle cx="14" cy="14" r="6" fill="white"/>
            </svg>`
          )}`,
          new BMapGL.Size(28, 36),
          { anchor: new BMapGL.Size(14, 36) }
        ),
      })
      mapInstance.addOverlay(marker)

      // 创建美化的信息窗口
      const infoWindow = new BMapGL.InfoWindow(
        `<div style="padding: 12px; min-width: 220px;">
          <div style="margin-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 8px; background: linear-gradient(135deg, #FF6B35 0%, #FF8F5C 100%); color: white; font-size: 11px; border-radius: 10px; font-weight: 500;">${community.city}</span>
          </div>
          <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">${community.name}</h4>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #666; line-height: 1.4;">${community.address || '地址待确认'}</p>
          <a href="/communities/${community.slug}"
             style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #FF6B35 0%, #FF8F5C 100%); color: white; font-size: 13px; font-weight: 500; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(255,107,53,0.3);">
            查看详情 →
          </a>
        </div>`,
        {
          width: 280,
          height: 0,
          title: '',
        }
      )

      marker.addEventListener('click', () => {
        mapInstance.openInfoWindow(infoWindow, point)
        onMarkerClick?.(community)
      })
    })

    // 如果有多个标记点且未选择城市，自动调整视野
    if (communities.length > 0 && !selectedCity) {
      // 保持默认的全国视野
    }
  }, [mapInstance, communities, onMarkerClick, selectedCity])

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden bg-gray-100">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">地图加载中...</div>
        </div>
      )}
    </div>
  )
}
