import type { HotTopicSection as HotTopicSectionType } from '@/lib/signal/types'

export function HotTopicSection({ section }: { section: HotTopicSectionType }) {
  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="border-l-4 border-primary pl-4">
        <div className="font-semibold text-ink">热词信号 · {section.slot}</div>
        <div className="text-mute text-sm">{section.subtitle}</div>
      </div>

      {section.intro && (
        <p className="text-mute text-sm leading-relaxed">{section.intro}</p>
      )}

      {/* Points list */}
      <div className="space-y-4">
        {section.points.map(point => (
          <div key={point.seq} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
              {point.seq}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink text-sm">{point.heading}</div>
              <p className="text-mute text-sm mt-0.5 leading-relaxed">{point.body}</p>
              {point.url && (
                <a
                  href={point.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline mt-0.5 inline-block"
                >
                  原文链接 →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Claim */}
      <blockquote className="bg-primary/5 border-l-4 border-primary px-4 py-3 text-ink text-sm leading-relaxed">
        {section.claim}
      </blockquote>

      {/* Observations */}
      {section.observations.length > 0 && (
        <ul className="space-y-1.5 pl-4">
          {section.observations.map((obs, i) => (
            <li key={i} className="text-mute text-sm list-disc">{obs}</li>
          ))}
        </ul>
      )}

      {/* OPC use */}
      {section.opc_use.length > 0 && (
        <div className="space-y-2">
          {section.opc_use.map((item, i) => (
            <div key={i} className="text-sm">
              <span className="text-primary font-medium">{item.role}</span>
              <span className="text-mute">：{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
