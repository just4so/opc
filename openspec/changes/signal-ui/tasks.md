# signal-ui · 任务清单

洞察板块（/news）及 Weekly Signal 相关页面视觉重构。
目标：Corporate Modern + Minimalist，高信息密度，橙色只做点睛用。

---

## T1 — SignalBanner 深色 Hero

**文件：** `components/signal/SignalBanner.tsx`

- [x] 外层容器改为 `bg-[#0F172A] rounded-xl px-6 py-8`，移除 `border border-hairline-soft` 和 `bg-surface-card`
- [x] 期号徽章：`bg-primary/10 text-primary` → `bg-primary text-white`（实心橙底白字）
- [x] 日期文字：`text-mute` → `text-white/60 text-xs`
- [x] 标题：`font-semibold text-ink text-base` → `text-white font-bold text-xl leading-snug`
- [x] 城市标签：移除 `bg-canvas text-ash border border-hairline-soft`，改为 `bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded`（无 border）
- [x] 右侧按钮：`rounded-2xl` → `rounded-lg`（其余样式 `bg-primary text-white px-5 py-2.5` 保留）
- [x] 移动端响应式：`flex-col md:flex-row` 已有，确认按钮在移动端全宽（`w-full md:w-auto`）

---

## T2 — Signal 详情页 Hero + 侧边导航

**文件：** `app/(main)/news/signal/[n]/page.tsx`（主要）；新建 `components/signal/SignalToc.tsx`

### 2a — Hero 区块

- [x] 用 `w-full -mx-4 bg-[#0F172A]` 全宽深色容器包裹 Hero，突破 `max-w-3xl` 的内边距
- [x] Hero 内层加 `max-w-3xl mx-auto px-6 py-10`
- [x] 顶部导航行移入 Hero 内：「← 返回洞察」和「往期档案」颜色改为 `text-white/60 hover:text-white`
- [x] 期号徽章：`bg-primary/10 text-primary rounded-full` → `bg-primary text-white text-sm px-3 py-1 rounded-lg`
- [x] 大标题 h1：`text-2xl md:text-3xl font-bold text-ink` → `text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight mt-3`
- [x] 日期+时间行：文字色改为 `text-white/60 text-sm mt-2`
- [x] `<SignalParticipants>` 移到 Hero 底部，传入 `variant="dark"`（T6 实现后生效）
- [x] 原 `<div className="mb-6">` Top nav 块移除（已并入 Hero）

### 2b — 导读块升级

- [x] `bg-primary/5 border-l-4 border-primary` → `bg-[#0F172A]/5 border-l-4 border-[#0F172A] px-5 py-4 rounded-r-lg text-ink text-sm leading-relaxed`

### 2c — 新建 SignalToc 客户端组件

- [x] 创建 `components/signal/SignalToc.tsx`，加 `'use client'`
- [x] Props：`{ sections: Array<{ id: string; label: string }> }`
- [x] 用 `useState` + `useEffect` + `IntersectionObserver` 追踪当前可见 section（`rootMargin: '-20% 0px -70% 0px'`）
- [x] 样式：`sticky top-24 hidden xl:block w-48 flex-shrink-0`
- [x] 每个条目：`text-sm text-mute hover:text-ink cursor-pointer py-1`
- [x] 当前高亮：`text-primary font-medium`
- [x] 点击调用 `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`
- [x] 顶部加小标题「目录」：`text-xs font-semibold text-ash uppercase tracking-wide mb-2`

### 2d — 页面布局两栏

- [x] 各 `<section>` 加 `id="section-{i}"` 属性
- [x] sections 渲染区外层改为 `<div className="xl:flex xl:gap-8 xl:items-start">`
- [x] sections 内容用 `<div className="flex-1 min-w-0 space-y-10">` 包裹
- [x] `<SignalToc sections={tocItems} />` 作为右侧兄弟元素
- [x] `tocItems` 从 sections 数组派生：`sections.map((s, i) => ({ id: \`section-\${i}\`, label: SECTION_LABELS[s.type] ?? s.type }))`

---

## T3 — Signal 往期列表页表格化

**文件：** `app/(main)/news/signal/page.tsx`

- [x] 页头加统计：`<span className="text-mute text-sm">{serialized.length} 期</span>`（紧跟副标题后）
- [x] 外层列表容器：`space-y-2` → `border border-[#E2E8F0] rounded-lg overflow-hidden`
- [x] 每行改为 `grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 items-center py-3 px-4`（去掉 `flex flex-wrap`）
- [x] 斑马纹：行 div 加 `odd:bg-white even:bg-[#F8FAFC]`，移除 `border-b border-hairline-soft`（由容器 border 替代），保留各行底边 `border-b border-[#E2E8F0]`
- [x] 期号徽章：`bg-primary/10 text-primary rounded-full` → `bg-primary text-white text-xs px-2 py-0.5 rounded font-semibold`（实心橙）
- [x] NEW 徽章保留（`bg-red-500 text-white`）
- [x] 标题：`font-semibold text-ink flex-1` → `font-medium text-ink text-sm`（保持 flex-1）
- [x] 日期：保持 `text-mute text-sm flex-shrink-0 whitespace-nowrap`
- [x] 城市标签组：外层加 `hidden md:flex gap-1`，隐藏移动端
- [x] 「查看」链接：样式保持 `text-primary text-sm hover:underline flex-shrink-0`
- [x] 移动端：容器内 `@apply` 或条件类改为 `grid-cols-[auto_1fr_auto]`——通过城市列 `hidden md:flex` 已自动处理

---

## T4 — 全局卡片样式统一

### 4a — components/news/news-card.tsx

- [x] 主卡片外层：移除 `shadow-sm hover:shadow-md`，改为 `hover:border-primary/30 transition-colors`
- [x] 图片容器：`w-24 h-24` → `w-20 h-20`
- [x] 底部元信息行：移除「约 X 分钟阅读」显示（删除 `·` + `<span>约 {readingMinutes} 分钟阅读</span>`）
- [x] 删除 `readingMinutes` 变量和 `estimateReadingMinutes` 函数（若只在此使用；news-client.tsx 中也有，单独处理）

### 4b — components/news/news-client.tsx

**OriginalSection 三列卡片：**
- [x] Link 外层：移除 `shadow-sm hover:shadow-md`，改为 `hover:border-primary/30 transition-colors`
- [x] `rounded-xl` → `rounded-lg`
- [x] 封面图容器：`h-40` → `aspect-video`（`w-full aspect-video overflow-hidden bg-surface-card`）
- [x] 底部元信息：移除「约 X 分钟阅读」（删除 `·` + `<span>约 {estimateReadingMinutes(...)}</span>`）
- [x] 删除本文件中的 `estimateReadingMinutes` 函数

**分类 Tab Chip 风格：**
- [x] 未选中：`bg-surface-card text-charcoal hover:bg-gray-200` → `border border-[#E2E8F0] bg-white text-[#64748B] hover:border-primary/50 hover:text-primary`
- [x] 选中：保持 `bg-primary text-white`，加 `border-primary border`
- [x] 圆角：`rounded-full` → `rounded-lg`

**Signal 往期入口 Link：**
- [x] 移除 `hover:shadow-sm`，改为 `hover:border-primary/40 hover:bg-primary/5`
- [x] `rounded-2xl` → `rounded-lg`

### 4c — components/signal/CasesSection.tsx

- [x] 卡片：`rounded-2xl` → `rounded-lg`
- [x] 移除卡片 `border border-hairline-soft`（视觉更干净，由左侧彩条区分）
- [x] 四字段加左侧彩色细条：
  - 背景（`background`）：字段 div 加 `border-l-2 border-blue-400 pl-3`
  - 动作（`action`）：加 `border-l-2 border-primary pl-3`
  - 结果（`result`）：加 `border-l-2 border-emerald-400 pl-3`
  - 建议（`advice`）：加 `border-l-2 border-purple-400 pl-3`
- [x] 字段标签 `text-ash text-xs` 改为各自对应主色（蓝/橙/绿/紫）

---

## T5 — PolicySection 斑马纹

**文件：** `components/signal/PolicySection.tsx`

- [x] 表头行：`border-b border-hairline-soft` → `bg-[#0F172A] text-white`，`th` 加 `text-xs uppercase tracking-wide py-2 px-3`，移除原 `text-ash`
- [x] 表体行：移除 `hover:bg-surface-card transition-colors`，改为 `odd:bg-white even:bg-[#F8FAFC]`
- [x] 类型标签颜色（按 `item.ptype` 匹配）：
  - 含「国家」：`bg-blue-50 text-blue-700`
  - 含「地方」或「省」或「市」：`bg-emerald-50 text-emerald-700`
  - 含「金融」或「贷」或「补贴」：`bg-purple-50 text-purple-700`
  - 其他：`bg-[#FFF7ED] text-primary`
- [x] 链接：`text-primary text-xs hover:underline`（已有，确认无 `text-ash`）
- [x] 无 `item.url` 时整列隐藏（`{item.url && <a>...</a>}`已有，确认 `td` 不留空白残影）
- [x] 移动端卡片：`rounded-2xl` → `rounded-lg`，`bg-primary/10 text-primary` 类型标签也同步上方颜色逻辑

---

## T6 — SignalParticipants 白色模式支持

**文件：** `components/signal/SignalParticipants.tsx`

- [x] 新增 Props：`variant?: 'default' | 'dark'`（默认 `'default'`）
- [x] `dark` 模式卡片容器：移除 `bg-surface-card border border-hairline-soft`，改为 `bg-white/10`
- [x] `dark` 模式姓名：`text-ink` → `text-white font-semibold`
- [x] `dark` 模式城市：`text-mute` → `text-white/60 text-xs`
- [x] `dark` 模式身份：`text-ash` → `text-white/60 text-xs`
- [x] `dark` 模式主持人徽章：`bg-primary/10 text-primary` → `bg-white/20 text-white`
- [x] `dark` 模式分享人徽章：`bg-surface-card text-mute border border-hairline-soft` → `bg-white/10 text-white/70 border-0`
- [x] 在 `app/(main)/news/signal/[n]/page.tsx` 的 Hero 内传入 `<SignalParticipants participants={participants} variant="dark" />`

---

## T7 — SEO 补丁

### 7a — Signal 详情页 generateMetadata

**文件：** `app/(main)/news/signal/[n]/page.tsx`

- [x] `select` 中新增 `intro: true`
- [x] 计算 `description`：`issue.intro ? issue.intro.slice(0, 120) + '...' : \`OPC 创业者每周情报汇 · 第${issueNo}期\``
- [x] 返回对象新增 `description` 字段
- [x] 新增 `openGraph: { title: ..., description, url: \`https://www.opcquan.com/news/signal/${issueNo}\` }`

### 7b — Signal 列表页 metadata

**文件：** `app/(main)/news/signal/page.tsx`

- [x] `metadata` 对象新增 `description: 'OPC 创业者每周情报交换活动的完整档案。每期包含 AI 热词解读、政策波段、实战分享与资源广播。'`

### 7c — Sitemap 新增 Signal 路由

**文件：** `app/sitemap.ts`

- [x] 在 `/news` 静态条目后新增 `/news/signal`（`changeFrequency: 'weekly'`, `priority: 0.7`）
- [x] 新增动态查询：`prisma.signalIssue.findMany({ where: { status: 'PUBLISHED' }, select: { issueNo: true, publishedAt: true } })`
- [x] 生成 `signalPages` 数组，每项 URL 为 `/news/signal/${issue.issueNo}`，`lastModified: issue.publishedAt`，`changeFrequency: 'monthly'`, `priority: 0.6`
- [x] `return` 语句中合并 `...signalPages`

---

## 验收

- [x] `npx tsc --noEmit` 零报错
- [x] `npm run build` 成功，无 TS/lint 错误
- [x] dev server 下 `/news` 无白屏，SignalBanner 显示深色背景
- [x] dev server 下 `/news/signal` 列表页显示斑马纹表格
- [x] dev server 下 `/news/signal/1`（或任意存在期号）顶部显示深色 Hero，桌面端（≥1280px）右侧出现 TOC 导航
- [x] PolicySection 表头深色，行交替底色
- [x] CasesSection 四字段左侧彩条正确
- [x] SignalParticipants 在 Hero 内文字为白色，在正文区保持默认色
