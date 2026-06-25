import type { PolicySection as PolicySectionType } from '@/lib/signal/types'

export function PolicySection({ section }: { section: PolicySectionType }) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline-soft">
              <th className="text-left text-ash font-medium py-2 pr-4 w-24">类型</th>
              <th className="text-left text-ash font-medium py-2 pr-4">政策内容</th>
              <th className="text-left text-ash font-medium py-2 pr-4 w-40">影响</th>
              <th className="text-left text-ash font-medium py-2 w-16">链接</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item, i) => (
              <tr key={i} className="border-b border-hairline-soft hover:bg-surface-card transition-colors">
                <td className="py-3 pr-4 align-top">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {item.ptype}
                  </span>
                </td>
                <td className="py-3 pr-4 text-ink leading-relaxed align-top">{item.content}</td>
                <td className="py-3 pr-4 text-mute align-top">{item.impact}</td>
                <td className="py-3 align-top">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs hover:underline"
                    >
                      原文
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {section.items.map((item, i) => (
          <div key={i} className="bg-surface-card rounded-2xl border border-hairline-soft p-4 space-y-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {item.ptype}
            </span>
            <p className="text-ink text-sm leading-relaxed">{item.content}</p>
            <p className="text-mute text-xs">{item.impact}</p>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs hover:underline"
              >
                原文链接 →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
