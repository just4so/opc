# news-layout-v2 — 洞察主页三栏重构 + Signal 详情可读性优化

## 改动一：数据层（app/(main)/news/page.tsx）

- [x] **T1-1** 在 `getDefaultNews` 的 `Promise.all` 中新增 `allSignals` 查询
  - `prisma.signalIssue.findMany({ where: { status: 'PUBLISHED' }, orderBy: { issueNo: 'desc' }, select: { issueNo, title, publishedAt, intro, participants } })`
  - 原有 `originals` 查询的 `take` 从 3 改为 5（供次栏原创列表使用）
  - 更新函数返回值：`return { news, total, originals, allSignals }`

- [x] **T1-2** 在 isDefaultView 路径中序列化 `allSignals` 日期并传给 `NewsClient`
  - `allSignals.map(s => ({ ...s, publishedAt: toISO(s.publishedAt), participants: s.participants as any[] }))`
  - `NewsClient` 新增 props：`allSignals` 和 `recentOriginals`（即现有 `initialOriginals`，改名或保留两者均可）

- [x] **T1-3** 非默认视图（有筛选时）同样在 page.tsx 中补 `allSignals` 查询，避免 prop 缺失报错
  - 可复用同一个 Prisma 语句，放在最后的 `Promise.all` 里

---

## 改动二-a：HeroCarousel 组件（在 news-client.tsx 内定义，不新建文件）

- [x] **T2-1** 定义 `CarouselItem` union type
  ```ts
  type CarouselItem =
    | { kind: 'signal'; issueNo: number; title: string; publishedAt: string; intro: string | null; cities: string[] }
    | { kind: 'article'; id: string; title: string; summary: string | null; coverImage: string | null; publishedAt: string; author: string | null }
  ```

- [x] **T2-2** 实现 Signal 卡片（深色）
  - 背景 `bg-[#0F172A]`，圆角 `rounded-xl`，尺寸 `w-[280px] md:w-[340px] flex-shrink-0 h-48`
  - 左上：`📡 Weekly Signal` 白色半透明小标签
  - 期号橙色徽章 + 标题白色 `font-bold text-base`
  - intro 前 80 字，`text-white/70 text-xs line-clamp-2`
  - 右下：`<Link href={/news/signal/${issueNo}}>查看本期 →</Link>`，`text-primary text-xs`

- [x] **T2-3** 实现原创文章卡片（浅色）
  - 背景 `bg-white border border-[#E2E8F0]`，圆角 `rounded-xl`，同宽 `h-48`
  - 上半：封面图 `aspect-[16/9] object-cover`；无图时橙色渐变占位（`bg-gradient-to-br from-primary/20 to-primary/5`）
  - 下半：标题 `text-sm font-semibold text-ink line-clamp-2` + 摘要 `text-xs text-mute line-clamp-2` + 时间

- [x] **T2-4** 轮播容器与隐藏滚动条
  - 外层 `-mx-4 px-4` 让轮播边到边
  - 内层 `flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory`
  - 每个 item 卡片加 `snap-start`
  - 用内联 style `{{ scrollbarWidth: 'none' }}` 或 CSS `-webkit-scrollbar: none` 隐藏滚动条（若项目已配置 `scrollbar-hide` 插件则直接用该类）

- [x] **T2-5** 组装 HeroCarousel：Signal 最新一期排第一，后跟最多 4 篇原创；无数据时不渲染（`if (!items.length) return null`）

---

## 改动二-b：NewsClient 三栏布局重构（components/news/news-client.tsx）

- [x] **T2-6** 新增 props 到 `NewsClientProps` interface
  ```ts
  allSignals?: Array<{ issueNo: number; title: string; publishedAt: string; intro: string | null; participants: any[] }> | null
  recentOriginals?: NewsItem[] | null
  ```

- [x] **T2-7** 移除以下已不需要的代码
  - `OriginalSection` 函数组件定义（整块删除）
  - `categories` 常量数组与分类 Tab JSX（`{categories.map(...)}`）
  - Signal 往期入口 Link（`查看所有 Weekly Signal 往期档案`）
  - `!loading && page === 1 && !category && originals.length > 0` 的原创专区块（含「更多洞察」分割线）
  - `news.map(NewsCard)` 文章列表（整个 `space-y-4` 块）
  - 分页 JSX（`pagination.totalPages > 1` 块）
  - 不再需要的 state/useEffect：`news`, `originals`, `pagination`, `loading`, `initialCategory`, `initialPage` 及对应的 `useEffect` fetch 逻辑

- [x] **T2-8** 保留并调整 HeroCarousel 位置
  - SignalBanner 整块删除（已被 Carousel 内的 Signal 卡片取代）
  - HeroCarousel 放在 `<PageHeader>` 下方、三栏主体上方

- [x] **T2-9** 实现三栏主体 grid
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-[45fr_30fr_25fr] gap-6 mt-8">
    {/* 主栏 */}
    {/* 次栏 */}
    {/* 侧栏 */}
  </div>
  ```

- [x] **T2-10** 主栏：Weekly Signal 列表
  - 标题行：`<h2 className="font-semibold text-ink mb-4">Weekly Signal</h2>` + `<Link href="/news/signal" className="text-primary text-xs">查看全部</Link>`（flex justify-between）
  - 每期卡片：`bg-white border border-[#E2E8F0] rounded-lg p-4 hover:border-primary/30 transition-colors`
    - 期号橙色徽章 + 日期（`text-xs text-mute`）
    - 标题 `font-semibold text-ink text-sm`
    - intro 前 60 字，`text-mute text-xs line-clamp-2`
    - 参与城市标签（`bg-white/10` → 改为 `bg-surface-card text-mute text-xs px-2 py-0.5 rounded-full`）
    - `<Link href={/news/signal/${s.issueNo}}>查看 →</Link>`，`text-primary text-xs`
  - 无 Signal 时：`<p className="text-mute text-sm py-4 text-center">每周四更新</p>`
  - 移动端显示全部；桌面端显示最多 5 期（`slice(0, 5)`）

- [x] **T2-11** 次栏：OPC 圈原创文章列表
  - 标题行：`<h2>OPC 圈原创</h2>` + `<Link href="/news">查看全部</Link>`（同主栏 flex 排列）
  - 紧凑行列表，无大图：`border-b border-[#E2E8F0] py-3`
    - 分类标签小色块（复用 `categoryColors` 和 `categoryLabels`，`text-xs px-2 py-0.5 rounded`）
    - 标题 `text-sm font-medium text-ink line-clamp-2`
    - 时间 `text-xs text-mute mt-1`
  - `recentOriginals.slice(0, 5)` 最多 5 篇
  - 无数据时不渲染此栏（或显示空状态）

- [x] **T2-12** 侧栏：政策库
  - 标题行：`<h2 className="font-semibold text-ink mb-4">政策库</h2>`
  - 直接渲染 `{policiesSlot}`
  - `policiesSlot` 不存在时侧栏整块不渲染（`{policiesSlot && <div>...</div>}`）

---

## 改动三：HotTopicSection 可读性优化（components/signal/HotTopicSection.tsx）

- [x] **T3-1** 要点列表从 `space-y-4` flex 改为 2 列卡片 grid
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {section.points.map(point => (
      <div key={point.seq} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {point.seq}
          </span>
          <span className="font-semibold text-ink text-sm">{point.heading}</span>
        </div>
        <p className="text-mute text-sm leading-relaxed">{point.body}</p>
        {point.url && (
          <a href={point.url} target="_blank" className="text-primary text-xs hover:underline mt-2 inline-block">原文 →</a>
        )}
      </div>
    ))}
  </div>
  ```

- [x] **T3-2** 「一句话主张」从 `blockquote` 改为左边框强调块
  ```tsx
  <div className="bg-primary/8 border-l-[6px] border-primary rounded-r-lg px-5 py-4 my-4">
    <div className="text-xs uppercase tracking-widest text-primary/60 mb-1 font-semibold">本期主张</div>
    <p className="text-ink text-base font-medium leading-relaxed">「{section.claim}」</p>
  </div>
  ```
  注：`bg-primary/8` 若不生效，改为 `bg-[#FFF7ED]`（即 primary-soft）

- [x] **T3-3** `opc_use` 从纯文本改为徽章+段落格式
  ```tsx
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
  ```

- [x] **T3-4** `observations` 从 `list-disc` 改为图标前缀
  ```tsx
  <div className="space-y-2">
    {section.observations.map((obs, i) => (
      <div key={i} className="flex gap-2 items-start text-mute text-sm">
        <span className="flex-shrink-0 text-primary mt-0.5">🔍</span>
        <span>{obs}</span>
      </div>
    ))}
  </div>
  ```

---

## 改动四：ResourcesSection 可读性优化（components/signal/ResourcesSection.tsx）

- [x] **T4-1** 每行添加左侧竖色条，调整内容层次
  ```tsx
  <div className="border-b border-[#E2E8F0] py-3">
    <div className="flex gap-3 items-start">
      <div className="w-1 min-h-[2rem] rounded-full bg-primary/40 flex-shrink-0 mt-0.5 self-stretch" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{item.rtype}</span>
          <span className="text-mute text-xs">{item.publisher}</span>
        </div>
        <p className="text-ink text-sm leading-relaxed">{item.content}</p>
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-primary text-xs hover:underline mt-1 inline-block">
            {item.urlLabel || '查看'} →
          </a>
        )}
      </div>
    </div>
  </div>
  ```
  原有的 `hover:bg-surface-card transition-colors px-2 -mx-2` 可保留或去掉（新布局里色条已提供视觉分层）

---

## 改动五：移动端 TOC 折叠（app/(main)/news/signal/[n]/page.tsx）

- [x] **T5-1** 在 Hero 块与 intro 块之间（或 intro 下方、sections 上方），加移动端目录折叠
  ```tsx
  {/* 移动端目录（xl 以下显示） */}
  <details className="xl:hidden mb-6 border border-[#E2E8F0] rounded-lg overflow-hidden">
    <summary className="px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-ink cursor-pointer flex items-center justify-between">
      本期目录
      <ChevronDown className="h-4 w-4 text-mute" />
    </summary>
    <div className="px-4 py-3 space-y-1">
      {tocItems.map(item => (
        <a key={item.id} href={`#${item.id}`} className="block text-sm text-mute hover:text-primary py-1">
          {item.label}
        </a>
      ))}
    </div>
  </details>
  ```
  - `tocItems` 在 page.tsx 里已有定义，直接复用
  - `ChevronDown` 已在项目 lucide-react 依赖中，在文件顶部 import 即可
  - 放置位置：`{issue.intro && <div ...>...</div>}` 块之后，`<div className="xl:flex ...">` 块之前

---

## 验收清单

- [x] **V1** `npx tsc --noEmit` 零报错
- [ ] **V2** `npm run build` 通过（含 Prisma generate）
- [ ] **V3** `/news` 主页：顶部 HeroCarousel 渲染，滚动可见 Signal 卡片（深色）+ 原创卡片（浅色）
- [ ] **V4** `/news` 桌面端：三栏布局（Signal 主栏 / 原创次栏 / 政策侧栏）各自显示正确内容
- [ ] **V5** `/news` 移动端（宽度 < 768px）：三栏变单列，轮播可横向滑动
- [ ] **V6** `/news/signal/1`：热词要点以 2 列卡片展示，「本期主张」有明显左边框高亮，OPC 建议使用徽章+段落格式，观察点前有 🔍 图标
- [ ] **V7** `/news/signal/1` 移动端（宽度 < 1280px）：顶部「本期目录」可点击展开/收起
- [ ] **V8** ResourcesSection 每行有左侧橙色竖条，rtype 和 publisher 显示在内容上方
- [ ] **V9** 无 Signal 数据时 `/news` 主栏显示「每周四更新」空状态，页面不崩溃
- [ ] **V10** 无原创文章时次栏不显示或显示空状态，不影响布局
