'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  alt?: string
}

export function ImageGallery({ images, alt = '产品图片' }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
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

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    scrollTo(index)
  }

  const closeLightbox = () => setActiveIndex(null)

  const lightboxPrev = useCallback(() => {
    setActiveIndex(i => {
      const next = i !== null ? (i - 1 + images.length) % images.length : null
      if (next !== null) scrollTo(next)
      return next
    })
  }, [images.length, scrollTo])

  const lightboxNext = useCallback(() => {
    setActiveIndex(i => {
      const next = i !== null ? (i + 1) % images.length : null
      if (next !== null) scrollTo(next)
      return next
    })
  }, [images.length, scrollTo])

  useEffect(() => {
    if (activeIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, lightboxPrev, lightboxNext])

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
      <div className="relative w-full rounded-2xl overflow-hidden bg-surface-card">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        >
          {images.map((src, i) => (
            <div key={i} className="flex-shrink-0 w-full snap-start">
              <div
                className="aspect-video cursor-zoom-in"
                onClick={() => openLightbox(i)}
              >
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

      {/* Lightbox */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={closeLightbox}
            aria-label="关闭"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={e => { e.stopPropagation(); lightboxPrev() }}
              aria-label="上一张"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <div
            className="relative max-w-[90vw] max-h-[85vh] w-full h-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[activeIndex]}
              alt={`${alt} ${activeIndex + 1}`}
              className="w-full h-full object-contain"
            />
          </div>

          {images.length > 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={e => { e.stopPropagation(); lightboxNext() }}
              aria-label="下一张"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
