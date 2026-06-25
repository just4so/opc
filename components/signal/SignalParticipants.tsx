import type { Participant } from '@/lib/signal/types'

interface SignalParticipantsProps {
  participants: Participant[]
  variant?: 'default' | 'dark'
}

export function SignalParticipants({ participants, variant = 'default' }: SignalParticipantsProps) {
  const isDark = variant === 'dark'

  return (
    <div className="flex flex-nowrap md:flex-wrap gap-3 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
      {participants.map((p, i) => (
        <div
          key={i}
          className={`flex-shrink-0 rounded-2xl px-4 py-3 min-w-[140px] ${
            isDark
              ? 'bg-white/10'
              : 'bg-surface-card border border-hairline-soft'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-ink'}`}>
              {p.name}
            </span>
            <span
              className={
                p.roleType === 'host'
                  ? isDark
                    ? 'text-xs px-1.5 py-0.5 rounded-full bg-white/20 text-white'
                    : 'text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary'
                  : isDark
                  ? 'text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 border-0'
                  : 'text-xs px-1.5 py-0.5 rounded-full bg-surface-card text-mute border border-hairline-soft'
              }
            >
              {p.roleType === 'host' ? '主持人' : '分享人'}
            </span>
          </div>
          <div className={`text-xs ${isDark ? 'text-white/60' : 'text-mute'}`}>{p.city}</div>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-ash'}`}>{p.roleLabel}</div>
        </div>
      ))}
    </div>
  )
}
