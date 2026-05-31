import React, { ReactNode } from 'react'

type HeaderTheme = 'communities' | 'plaza' | 'news' | 'default'

interface PageHeaderProps {
  title: ReactNode  // 支持 JSX（带色彩的标题）
  subtitle?: string
  theme?: HeaderTheme
  children?: ReactNode  // 右侧操作区
}

function DecorationCommunities() {
  return (
    <>
      {/* 橙色光晕 */}
      <div className="absolute top-[-40px] right-[12%] w-[280px] h-[280px] rounded-full bg-primary/[0.08] blur-[50px]" />
      {/* 对角线 — 地图感 */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[60%] w-[200px] h-[1px] bg-primary/[0.12] rotate-[35deg]" />
        <div className="absolute top-[45%] left-[55%] w-[160px] h-[1px] bg-primary/[0.10] rotate-[-20deg]" />
        <div className="absolute top-[30%] left-[70%] w-[120px] h-[1px] bg-primary/[0.08] rotate-[60deg]" />
      </div>
      {/* 地图标注点 */}
      <div className="absolute top-[25%] right-[18%] w-[40px] h-[40px] rounded-full border-[2px] border-primary/[0.15]" />
      <div className="absolute top-[22%] right-[17.2%] w-[10px] h-[10px] rounded-full bg-primary/[0.20]" />
    </>
  )
}

function DecorationPlaza() {
  return (
    <>
      {/* 暖黄橙光晕 */}
      <div className="absolute top-[-30px] right-[15%] w-[250px] h-[250px] rounded-full bg-primary/[0.08] blur-[50px]" />
      {/* 圆环 — 连接感 */}
      <div className="absolute top-[15%] right-[12%] w-[80px] h-[80px] rounded-full border-[2px] border-primary/[0.15]" />
      <div className="absolute top-[30%] right-[20%] w-[50px] h-[50px] rounded-full border-[2px] border-primary/[0.12]" />
      <div className="absolute top-[20%] right-[8%] w-[35px] h-[35px] rounded-full border-[2px] border-primary/[0.10]" />
      {/* 连接线 */}
      <div className="absolute top-[35%] right-[16%] w-[60px] h-[1px] bg-primary/[0.12] rotate-[45deg]" />
      <div className="absolute top-[28%] right-[11%] w-[40px] h-[1px] bg-primary/[0.10] rotate-[-30deg]" />
    </>
  )
}

function DecorationNews() {
  return (
    <>
      {/* 光晕 */}
      <div className="absolute top-[-30px] right-[10%] w-[260px] h-[260px] rounded-full bg-primary/[0.07] blur-[50px]" />
      {/* 横线 — 信息流感 */}
      <div className="absolute top-[25%] right-[8%] w-[140px] h-[1.5px] bg-primary/[0.12]" />
      <div className="absolute top-[40%] right-[12%] w-[100px] h-[1.5px] bg-primary/[0.10]" />
      <div className="absolute top-[55%] right-[6%] w-[120px] h-[1.5px] bg-primary/[0.08]" />
      {/* 粗竖线 — 分栏线 */}
      <div className="absolute top-[15%] right-[22%] w-[2.5px] h-[70%] bg-primary/[0.10]" />
    </>
  )
}

function DecorationDefault() {
  return (
    <>
      <div className="absolute top-[-60px] right-[10%] w-[300px] h-[300px] rounded-full bg-primary/[0.06] blur-[60px]" />
    </>
  )
}

const decorations: Record<HeaderTheme, () => React.ReactElement> = {
  communities: DecorationCommunities,
  plaza: DecorationPlaza,
  news: DecorationNews,
  default: DecorationDefault,
}

export function PageHeader({ title, subtitle, theme = 'default', children }: PageHeaderProps) {
  const Decoration = decorations[theme]

  return (
    <div className="relative overflow-hidden bg-canvas border-b border-hairline-soft">
      <Decoration />

      <div className="relative z-10 container mx-auto px-4 pt-10 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink tracking-tight text-balance">{title}</h1>
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
