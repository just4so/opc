import type { Participant } from '@/lib/signal/types'

export function SignalParticipants({ participants }: { participants: Participant[] }) {
  return (
    <div className="flex flex-nowrap md:flex-wrap gap-3 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
      {participants.map((p, i) => (
        <div
          key={i}
          className="flex-shrink-0 bg-surface-card border border-hairline-soft rounded-2xl px-4 py-3 min-w-[140px]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-ink text-sm">{p.name}</span>
            <span
              className={
                p.roleType === 'host'
                  ? 'text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary'
                  : 'text-xs px-1.5 py-0.5 rounded-full bg-surface-card text-mute border border-hairline-soft'
              }
            >
              {p.roleType === 'host' ? '主持人' : '分享人'}
            </span>
          </div>
          <div className="text-mute text-xs">{p.city}</div>
          <div className="text-ash text-xs mt-0.5">{p.roleLabel}</div>
        </div>
      ))}
    </div>
  )
}
