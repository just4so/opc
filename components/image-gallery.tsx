'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  communityName: string
}

export function ImageGallery({ images, communityName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const open = (index: number) => setActiveIndex(index)
  const close = () => setActiveIndex(null)

  const prev = useCallback(() => {
    setActiveIndex(i => (i !== null ? (i - 1 + images.length) % images.length : null))
  }, [images.length])

  const next = useCallback(() => {
    setActiveIndex(i => (i !== null ? (i + 1) % images.length : null))
  }, [images.length])

  useEffect(() => {
    if (activeIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, prev, next])

  // 打开时锁定 body 滚动
  useEffect(() => {
    if (activeIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [activeIndex])

  return (
    <>
      {/* 图片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {images.map((src, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in group"
            onClick={() => open(index)}
          >
            <Image
              src={src}
              alt={`${communityName} 图片 ${index + 1}`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              unoptimized
            />
            {/* hover 遮罩提示 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                点击查看
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={close}
            aria-label="关闭"
          >
            <X className="h-6 w-6" />
          </button>

          {/* 计数 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIndex + 1} / {images.length}
          </div>

          {/* 左箭头 */}
          {images.length > 1 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="上一张"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* 主图 */}
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[activeIndex]}
              alt={`${communityName} 图片 ${activeIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* 右箭头 */}
          {images.length > 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="下一张"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* 缩略图条（超过3张才显示） */}
          {images.length > 3 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] pb-1">
              {images.map((src, i) => (
                <div
                  key={i}
                  className={`relative w-14 h-10 flex-shrink-0 rounded overflow-hidden cursor-pointer border-2 transition-all ${
                    i === activeIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  onClick={e => { e.stopPropagation(); setActiveIndex(i) }}
                >
                  <Image src={src} alt="" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
