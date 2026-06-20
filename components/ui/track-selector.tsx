'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { MAIN_TRACK_OPTIONS, resolveTrackLabel } from '@/lib/labels'

interface TrackSelectorProps {
  value: string[]
  onChange: (v: string[]) => void
  maxSelect?: number
}

export function TrackSelector({ value, onChange, maxSelect = 3 }: TrackSelectorProps) {
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((t) => t !== v))
    } else {
      if (value.length >= maxSelect) return
      onChange([...value, v])
    }
  }

  const remove = (v: string) => {
    onChange(value.filter((t) => t !== v))
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed || value.includes(trimmed)) {
      setCustomInput('')
      return
    }
    if (value.length >= maxSelect) return
    onChange([...value, trimmed])
    setCustomInput('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="min-h-[40px] w-full flex flex-wrap gap-1.5 items-center px-3 py-2 border border-hairline rounded-2xl cursor-pointer bg-canvas"
      >
        {value.length === 0 && (
          <span className="text-ash text-sm">选择你的主要方向（最多 {maxSelect} 个）</span>
        )}
        {value.map(v => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
          >
            {resolveTrackLabel(v)}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(v) }}
              className="hover:text-primary/70"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="h-4 w-4 text-ash ml-auto shrink-0" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-canvas border border-hairline rounded-2xl shadow-lg z-50 overflow-hidden">
          {MAIN_TRACK_OPTIONS.map(opt => {
            const selected = value.includes(opt.value)
            const disabled = !selected && value.length >= maxSelect
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => toggle(opt.value)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  selected
                    ? 'bg-primary/5 text-primary font-medium'
                    : disabled
                    ? 'text-ash cursor-not-allowed opacity-50'
                    : 'text-ink hover:bg-surface-soft'
                }`}
              >
                {opt.label}
                {selected && <span className="text-primary text-xs">✓</span>}
              </button>
            )
          })}
          {/* Custom input row */}
          <div className="px-3 py-2 border-t border-hairline-soft">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
              placeholder="其他方向，Enter 添加..."
              disabled={value.length >= maxSelect}
              className="w-full px-2 py-1.5 text-xs border border-hairline rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-charcoal placeholder:text-ash disabled:opacity-50 bg-canvas"
            />
          </div>
        </div>
      )}
    </div>
  )
}
