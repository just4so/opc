'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { MAIN_TRACK_OPTIONS } from '@/lib/labels'

interface TrackSelectorProps {
  value: string[]
  onChange: (v: string[]) => void
  maxSelect?: number
}

/**
 * 赛道多选选择器
 * - 6 个预设标签卡片，点击 toggle 选中/取消
 * - 底部输入框支持自定义标签（Enter 或失焦添加）
 * - 已选标签显示为 pill，带 × 删除
 */
export function TrackSelector({ value, onChange, maxSelect = 3 }: TrackSelectorProps) {
  const [customInput, setCustomInput] = useState('')

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((t) => t !== v))
    } else {
      if (value.length >= maxSelect) return
      onChange([...value, v])
    }
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

  const remove = (v: string) => {
    onChange(value.filter((t) => t !== v))
  }

  // 自定义标签 = 不在预设 options 里的
  const customTags = value.filter(
    (t) => !MAIN_TRACK_OPTIONS.find((o) => o.value === t)
  )

  return (
    <div className="space-y-3">
      {/* 预设标签 */}
      <div className="grid grid-cols-2 gap-2">
        {MAIN_TRACK_OPTIONS.map((opt) => {
          const selected = value.includes(opt.value)
          const disabled = !selected && value.length >= maxSelect
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt.value)}
              className={`text-left text-xs px-3 py-2 rounded-2xl border transition-colors ${
                selected
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : disabled
                  ? 'border-hairline-soft text-ash cursor-not-allowed opacity-50'
                  : 'border-hairline-soft text-mute hover:border-hairline'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* 已选自定义标签 */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 bg-primary/5 text-primary text-xs px-2 py-0.5 rounded-full"
            >
              {t}
              <button type="button" onClick={() => remove(t)} className="hover:text-primary/70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 自定义输入 */}
      {value.length < maxSelect && (
        <div>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onBlur={addCustom}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            placeholder="其他方向，如：硬件创业、私域运营..."
            className="w-full px-3 py-2 text-xs border border-hairline rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-charcoal placeholder:text-ash"
          />
        </div>
      )}

      {value.length >= maxSelect && (
        <p className="text-xs text-ash">最多选 {maxSelect} 个方向</p>
      )}
    </div>
  )
}
