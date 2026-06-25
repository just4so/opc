import type { PolicySection as PolicySectionType } from '@/lib/signal/types'

function getPtypeColor(ptype: string): string {
  if (ptype.includes('国家')) return 'bg-blue-50 text-blue-700'
  if (ptype.includes('地方') || ptype.includes('省') || ptype.includes('市')) return 'bg-emerald-50 text-emerald-700'
  if (ptype.includes('金融') || ptype.includes('贷') || ptype.includes('补贴')) return 'bg-purple-50 text-purple-700'
  return 'bg-[#FFF7ED] text-primary'
}

export function PolicySection({ section }: { section: PolicySectionType }) {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[#E2E8F0]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0F172A] text-white">
              <th className="text-left text-xs uppercase tracking-wide py-2 px-3 w-24 font-medium">类型</th>
              <th className="text-left text-xs uppercase tracking-wide py-2 px-3 font-medium">政策内容</th>
              <th className="text-left text-xs uppercase tracking-wide py-2 px-3 w-40 font-medium">影响</th>
              <th className="text-left text-xs uppercase tracking-wide py-2 px-3 w-16 font-medium">链接</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                <td className="py-3 px-3 align-top">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPtypeColor(item.ptype)}`}>
                    {item.ptype}
                  </span>
                </td>
                <td className="py-3 px-3 text-ink leading-relaxed align-top">{item.content}</td>
                <td className="py-3 px-3 text-mute align-top">{item.impact}</td>
                <td className="py-3 px-3 align-top">
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
          <div key={i} className="bg-surface-card rounded-lg border border-hairline-soft p-4 space-y-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPtypeColor(item.ptype)}`}>
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
