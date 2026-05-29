'use client'

import { useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  alt?: string
}

export function ImageGallery({ images, alt = '产品图片' }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const single = images.length === 1

  const scrollTo = useCallback((index: number) => {
    setCurrent(index)
    scrollRef.current?.children[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }, [])

  const prev = () => scrollTo(current > 0 ? current - 1 : images.length - 1)
  const next = () => scrollTo(current < images.length - 1 ? current + 1 : 0)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== current) setCurrent(idx)
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-surface-card">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
      >
        {images.map((src, i) => (
          <div key={i} className="flex-shrink-0 w-full snap-start">
            <div className="aspect-video">
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {!single && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
