'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KeyValueInputProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  addLabel?: string
}

export function KeyValueInput({
  value,
  onChange,
  keyPlaceholder = '键',
  valuePlaceholder = '值',
  addLabel = '添加',
}: KeyValueInputProps) {
  const safeValue: Record<string, string> = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const entries = Object.entries(safeValue)

  const addRow = () => {
    onChange({ ...safeValue, '': '' })
  }

  const updateRow = (oldKey: string, newKey: string, newValue: string) => {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(safeValue)) {
      if (k === oldKey) {
        next[newKey] = newValue
      } else {
        next[k] = v
      }
    }
    onChange(next)
  }

  const removeRow = (key: string) => {
    const next = { ...safeValue }
    delete next[key]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {entries.map(([k, v], index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={k}
            onChange={(e) => updateRow(k, e.target.value, v)}
            placeholder={keyPlaceholder}
            className="w-1/3 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
          <input
            type="text"
            value={v}
            onChange={(e) => updateRow(k, k, e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
          <button
            type="button"
            onClick={() => removeRow(k)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4 mr-1" />
        {addLabel}
      </Button>
    </div>
  )
}
