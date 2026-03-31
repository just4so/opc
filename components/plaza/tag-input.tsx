'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  maxTags?: number
}

interface TagSuggestion {
  tag: string
  count: number
}

export function PlazaTagInput({
  value,
  onChange,
  placeholder = '输入后按回车添加',
  maxTags = 5,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const atMax = value.length >= maxTags

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim()
    if (!normalized || value.includes(normalized) || value.length >= maxTags) return
    onChange([...value, normalized])
    setInput('')
    setSuggestions([])
    setShowDropdown(false)
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!input.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(input)}`)
        const data: TagSuggestion[] = await res.json()
        setSuggestions(data.filter(s => !value.includes(s.tag)))
        setShowDropdown(data.length > 0)
      } catch {
        // ignore
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input])

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-sm rounded"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i) }}
              className="text-primary/50 hover:text-red-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder={value.length === 0 ? placeholder : '+ 添加'}
            className="flex-1 min-w-[80px] outline-none text-sm text-gray-500"
          />
        )}
        {atMax && (
          <span className="text-xs text-gray-400 self-center">最多{maxTags}个标签</span>
        )}
      </div>

      {showDropdown && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s.tag}
              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              onMouseDown={() => addTag(s.tag)}
            >
              <span>{s.tag}</span>
              <span className="text-xs text-gray-400">{s.count} 篇</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
