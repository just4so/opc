import type { CustomSection as CustomSectionType } from '@/lib/signal/types'

export function CustomSection({ section }: { section: CustomSectionType }) {
  return (
    <div className="space-y-3">
      <div className="border-l-4 border-primary pl-4 font-semibold text-ink">
        {section.label}
      </div>
      <p className="text-ink leading-relaxed">{section.content}</p>
    </div>
  )
}
