'use client'

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ArrayInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  addLabel?: string
}

export function ArrayInput({
  value: rawValue,
  onChange,
  placeholder = '输入内容',
  addLabel = '添加',
}: ArrayInputProps) {
  const value = Array.isArray(rawValue) ? rawValue : []

  const addItem = () => {
    onChange([...value, ''])
  }

  const updateItem = (index: number, newValue: string) => {
    const updated = [...value]
    updated[index] = newValue
    onChange(updated)
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const updated = [...value]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item)
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => moveItem(index, index - 1)}
              disabled={index === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" />
        {addLabel}
      </Button>
    </div>
  )
}
