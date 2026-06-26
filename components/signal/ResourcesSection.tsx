import type { ResourcesSection as ResourcesSectionType } from '@/lib/signal/types'

export function ResourcesSection({ section }: { section: ResourcesSectionType }) {
  return (
    <div>
      {section.items.map((item, i) => (
        <div key={i} className="border-b border-[#E2E8F0] py-3">
          <div className="flex gap-3 items-start">
            <div className="w-1 min-h-[2rem] rounded-full bg-primary/40 flex-shrink-0 mt-0.5 self-stretch" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{item.rtype}</span>
                <span className="text-mute text-xs">{item.publisher}</span>
              </div>
              <p className="text-ink text-sm leading-relaxed">{item.content}</p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline mt-1 inline-block"
                >
                  {item.urlLabel || '查看'} →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
