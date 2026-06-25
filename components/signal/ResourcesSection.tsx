import type { ResourcesSection as ResourcesSectionType } from '@/lib/signal/types'

export function ResourcesSection({ section }: { section: ResourcesSectionType }) {
  return (
    <div>
      {section.items.map((item, i) => (
        <div
          key={i}
          className="border-b border-hairline-soft py-3 hover:bg-surface-card transition-colors px-2 -mx-2"
        >
          <div className="flex items-start gap-3 flex-wrap">
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-0.5">
              {item.rtype}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm leading-relaxed">{item.content}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-mute text-xs">{item.publisher}</span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    {item.urlLabel || '查看'} →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
