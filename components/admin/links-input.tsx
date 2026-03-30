'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LinkItem {
  title: string
  url: string
  id?: string
}

interface LinksInputProps {
  value: LinkItem[]
  onChange: (value: LinkItem[]) => void
}

export function LinksInput({ value: rawValue, onChange }: LinksInputProps) {
  const value: LinkItem[] = Array.isArray(rawValue) ? rawValue : []

  const addLink = () => {
    onChange([...value, { title: '', url: '', id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }])
  }

  const updateLink = (index: number, field: 'title' | 'url', newValue: string) => {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: newValue }
    onChange(updated)
  }

  const removeLink = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {value.map((link, index) => (
        <div key={link.id ?? index} className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={link.title}
              onChange={(e) => updateLink(index, 'title', e.target.value)}
              placeholder="链接标题"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(index, 'url', e.target.value)}
              placeholder="https://"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => removeLink(index)}
            className="mt-2 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addLink}>
        <Plus className="h-4 w-4 mr-1" />
        添加链接
      </Button>
    </div>
  )
}
