'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { X, Plus } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({
  value: rawValue,
  onChange,
  placeholder = '输入后按回车添加',
  className = '',
}: TagInputProps) {
  const value = Array.isArray(rawValue) ? rawValue : []
  const [inputValue, setInputValue] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
        setInputValue('')
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditingValue(value[index])
  }

  const commitEdit = () => {
    if (editingIndex === null) return
    const trimmed = editingValue.trim()
    if (!trimmed) {
      // 删除空 tag
      onChange(value.filter((_, i) => i !== editingIndex))
    } else {
      const updated = [...value]
      updated[editingIndex] = trimmed
      onChange(updated)
    }
    setEditingIndex(null)
    setEditingValue('')
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditingIndex(null); setEditingValue('') }
  }

  return (
    <div
      className={`flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary min-h-[42px] ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        editingIndex === index ? (
          <input
            key={index}
            autoFocus
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={commitEdit}
            className="px-2 py-0.5 text-sm border border-primary rounded outline-none bg-white min-w-[60px] max-w-[200px]"
            style={{ width: `${Math.max(editingValue.length + 2, 6)}ch` }}
          />
        ) : (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-sm rounded cursor-pointer hover:bg-primary/20 group"
            onDoubleClick={() => startEdit(index)}
            title="双击编辑"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(index) }}
              className="text-primary/50 hover:text-red-500 transition-colors ml-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : '+ 添加'}
        className="flex-1 min-w-[80px] outline-none text-sm text-gray-500"
      />
    </div>
  )
}
