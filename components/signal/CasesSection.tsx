import { MessageCircle } from 'lucide-react'
import type { CasesSection as CasesSectionType } from '@/lib/signal/types'

const FIELD_CONFIG = [
  { key: 'background', label: '背景', bar: 'border-l-2 border-blue-400 pl-3', labelColor: 'text-blue-500 text-xs' },
  { key: 'action', label: '动作', bar: 'border-l-2 border-primary pl-3', labelColor: 'text-primary text-xs' },
  { key: 'result', label: '结果', bar: 'border-l-2 border-emerald-400 pl-3', labelColor: 'text-emerald-500 text-xs' },
  { key: 'advice', label: '建议', bar: 'border-l-2 border-purple-400 pl-3', labelColor: 'text-purple-500 text-xs' },
] as const

export function CasesSection({ section }: { section: CasesSectionType }) {
  return (
    <div className="space-y-4">
      {section.items.map((item, i) => (
        <div key={i} className="bg-surface-card rounded-lg p-5 space-y-3">
          {/* Card header */}
          <div className="flex items-start gap-2 flex-wrap">
            <span className="font-semibold text-ink">{item.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
              {item.caseType}
            </span>
          </div>

          {/* Author row */}
          <div className="text-mute text-sm">
            {item.name} · {item.city} · {item.roleLabel}
          </div>

          {/* Four fields with colored left bars */}
          <div className="space-y-2">
            {FIELD_CONFIG.map(({ key, label, bar, labelColor }) => (
              <div key={key} className={bar}>
                <span className={labelColor}>{label}：</span>
                <span className="text-ink text-sm">{item[key]}</span>
              </div>
            ))}
          </div>

          {/* Contact */}
          {item.contact && (
            <div className="flex items-center gap-1.5 text-mute text-sm">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{item.contact}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
