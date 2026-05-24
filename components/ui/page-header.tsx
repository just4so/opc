import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode  // 右侧操作区（如按钮）
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-canvas border-b border-hairline-soft">
      {/* 装饰元素 — 和首页同款但更克制 */}
      <div className="absolute top-[-60px] right-[10%] w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-[60px]" />
      <div className="absolute bottom-[-40px] left-[5%] w-[200px] h-[200px] rounded-full bg-amber-300/[0.03] blur-[50px]" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative z-10 container mx-auto px-4 pt-10 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-mute mt-1.5">{subtitle}</p>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  )
}
