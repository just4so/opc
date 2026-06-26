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

      {/* Points — 2-column card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {section.points.map((point) => (
          <div key={point.seq} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {point.seq}
              </span>
              <span className="font-semibold text-ink text-sm">{point.heading}</span>
            </div>
            <p className="text-mute text-sm leading-relaxed">{point.body}</p>
            {point.url && (
              <a
                href={point.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs hover:underline mt-2 inline-block"
              >
                原文 →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Claim — 左边框强调块 */}
      <div className="bg-[#FFF7ED] border-l-[6px] border-primary rounded-r-lg px-5 py-4 my-4">
        <div className="text-xs uppercase tracking-widest text-primary/60 mb-1 font-semibold">本期主张</div>
        <p className="text-ink text-base font-medium leading-relaxed">「{section.claim}」</p>
      </div>

      {/* Observations — 图标前缀 */}
      {section.observations.length > 0 && (
        <div className="space-y-2">
          {section.observations.map((obs, i) => (
            <div key={i} className="flex gap-2 items-start text-mute text-sm">
              <span className="flex-shrink-0 text-primary mt-0.5">🔍</span>
              <span>{obs}</span>
            </div>
          ))}
        </div>
      )}

      {/* OPC use — 徽章+段落格式 */}
      {section.opc_use.length > 0 && (
        <div className="space-y-3">
          {section.opc_use.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded mt-0.5">
                {item.role}
              </span>
              <p className="text-mute text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
