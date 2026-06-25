# signal-m2 — Weekly Signal 前台页面

> Milestone: M2 | 依赖: M1 已完成（SignalIssue 模型 + News.hidden 字段已存在）
> 参考规格: docs/signal-prd.md 第五节、第九节 M2

---

## Task 1: 基础类型定义

**文件:** `lib/signal/types.ts`（新建）

- [x] 定义 `Participant` 类型（name/city/roleLabel/roleType）
- [x] 定义 `HotTopicSection`、`PolicySection`、`CasesSection`、`ResourcesSection`、`CustomSection` 类型（与 signal-prd.md 三节 schema 完全一致）
- [x] 导出 `Section = HotTopicSection | PolicySection | CasesSection | ResourcesSection | CustomSection`
- [x] 导出 `SignalIssueData` 类型（包含 issueNo/title/publishedAt/activityTime/intro/participants/sections）
- [x] **验收:** `npm run build` 无 TS 报错

---

## Task 2: SignalParticipants 组件

**文件:** `components/signal/SignalParticipants.tsx`（新建）

- [x] props: `{ participants: Participant[] }`
- [x] 渲染横向滚动或 flex-wrap 行，每人一个卡片
- [x] 每张卡片显示：姓名（font-semibold）+ 城市（text-mute）+ 身份 roleLabel（text-ash text-sm）+ 角色标签（主持人/分享人，用 `bg-primary/10 text-primary` 徽章）
- [x] 主持人徽章颜色区分：`bg-primary/10 text-primary`；分享人：`bg-surface-card text-mute`
- [x] 响应式：移动端横向滚动，桌面端 flex-wrap
- [x] **验收:** 组件文件存在（`ls components/signal/SignalParticipants.tsx`），无 TS 报错

---

## Task 3: SignalBanner 组件

**文件:** `components/signal/SignalBanner.tsx`（新建）

- [x] props: `{ issue: { issueNo: number; title: string; publishedAt: string; participants: Participant[] } }`
- [x] 全宽卡片：`bg-surface-card rounded-2xl border border-hairline-soft`（或参考 PRD 配色）
- [x] 左侧：期号徽章（`bg-primary/10 text-primary`）+ 大标题 + 日期（格式 YYYY-MM-DD）+ 参与城市标签（从 participants 去重提取 city，`rounded-full` 小标签）
- [x] 右侧：「查看本期 →」按钮，href=`/news/signal/${issue.issueNo}`
- [x] 移动端垂直堆叠，按钮在下方
- [x] **验收:** 组件文件存在，无 TS 报错

---

## Task 4: HotTopicSection 组件

**文件:** `components/signal/HotTopicSection.tsx`（新建）

- [x] props: `{ section: HotTopicSection }`
- [x] 板块头：左侧橙色竖条（`border-l-4 border-primary`）+ 板块名（如「热词信号 · A」）+ 副标题（text-mute text-sm）
- [x] 5 条要点列表：序号圆徽 + 小标题（font-semibold）+ 正文（text-mute）+ 原文链接（若有，`text-primary hover:underline` 外链）
- [x] 一句话主张：`bg-primary/5 border-l-4 border-primary px-4 py-3` blockquote 样式
- [x] 观察点列表：无序列表，`text-mute` 小号
- [x] opc_use 建议：按 role 分组，每条「`role`：text」格式，role 加 `text-primary font-medium`
- [x] **验收:** 组件文件存在，无 TS 报错

---

## Task 5: PolicySection 组件

**文件:** `components/signal/PolicySection.tsx`（新建）

- [x] props: `{ section: PolicySection }`
- [x] 表格布局（响应式，移动端改为卡片列表）
- [x] 列：类型标签（ptype，`rounded-full bg-primary/10 text-primary text-xs`）| 政策内容（text-ink）| 影响（text-mute）| 原文链接（若有）
- [x] 桌面端：`<table>` 布局，`border-collapse`，行间分隔线
- [x] 移动端（< md）：每条改为卡片，字段纵向展示
- [x] **验收:** 组件文件存在，无 TS 报错

---

## Task 6: CasesSection 组件

**文件:** `components/signal/CasesSection.tsx`（新建）

- [x] props: `{ section: CasesSection }`
- [x] 每位分享者一张卡片：`bg-surface-card rounded-2xl border border-hairline-soft p-5`
- [x] 卡片头：标题（font-semibold）+ caseType 类型标签（`rounded-full`）
- [x] 作者行：姓名 + 城市 + roleLabel（text-mute text-sm）
- [x] 四项字段（背景/动作/结果/建议）：用字段名（text-ash text-xs）+ 内容（text-ink）格式展示
- [x] 联系方式（若有）：`contact` 字段用 `text-mute text-sm` 显示，加联系图标
- [x] **验收:** 组件文件存在，无 TS 报错

---

## Task 7: ResourcesSection 组件

**文件:** `components/signal/ResourcesSection.tsx`（新建）

- [x] props: `{ section: ResourcesSection }`
- [x] 列表行：类型标签（rtype）| 需求描述（content）| 发布者（publisher，text-mute）| 链接（urlLabel 或「查看」，外链）
- [x] 每行 `border-b border-hairline-soft py-3`，hover 背景 `hover:bg-surface-card`
- [x] **验收:** 组件文件存在，无 TS 报错

---

## Task 8: CustomSection 组件（兜底）

**文件:** `components/signal/CustomSection.tsx`（新建）

- [x] props: `{ section: CustomSection }`
- [x] 渲染 label 作为带橙色竖条的小标题
- [x] content 用 `<p className="text-ink leading-relaxed">` 渲染
- [x] **验收:** 组件文件存在，无 TS 报错

---

## Task 9: API — 公开列表

**文件:** `app/api/signal/route.ts`（新建）

- [x] `GET` handler，无需鉴权
- [x] 查询 `prisma.signalIssue.findMany({ where: { status: 'PUBLISHED' }, orderBy: { issueNo: 'desc' }, select: { issueNo, title, publishedAt, participants } })`
- [x] `publishedAt` 序列化为 `.toISOString()` 再返回
- [x] 返回 JSON 数组，`Cache-Control: public, s-maxage=300`
- [x] **验收:** `curl http://localhost:3000/api/signal` 返回 `[]`（空库时）或 JSON 数组

---

## Task 10: API — 单期详情

**文件:** `app/api/signal/[n]/route.ts`（新建）

- [x] `GET` handler，路由参数 `n` 为 issueNo（字符串转整数）
- [x] 查询 `prisma.signalIssue.findUnique({ where: { issueNo: n, status: 'PUBLISHED' } })`（未发布不返回）
- [x] 未找到返回 `{ error: 'not found' }` + 404 状态码
- [x] `publishedAt`/`createdAt`/`updatedAt` 序列化为 `.toISOString()`
- [x] **验收:** `curl http://localhost:3000/api/signal/999` 返回 404

---

## Task 11: 往期列表页

**文件:** `app/(main)/news/signal/page.tsx`（新建）

- [x] Server Component，`export const revalidate = 300`
- [x] 查询 `prisma.signalIssue.findMany({ where: { status: 'PUBLISHED' }, orderBy: { issueNo: 'desc' } })`，`select: { issueNo, title, publishedAt, participants }`
- [x] `publishedAt` 传给客户端前调用 `.toISOString()`
- [x] 页面顶部：「← 返回洞察」链接（`/news`）+ PageHeader「Weekly Signal · 往期档案」
- [x] **空状态**（无已发布期）：居中显示「每周四更新，敬请期待」（text-mute）
- [x] 每期一行：
  - 期号徽章（`bg-primary/10 text-primary rounded-full px-2 py-0.5 text-sm`）
  - 大标题（font-semibold text-ink）
  - 日期（text-mute text-sm，格式 YYYY-MM-DD）
  - 参与城市标签（从 participants 去重，`rounded-full bg-surface-card text-ash text-xs`）
  - 「查看」链接（`/news/signal/${issueNo}`，`text-primary hover:underline`）
- [x] 最新一期（issueNo 最大）加「NEW」红色标签（`bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full`）
- [x] `generateMetadata`: `title = "Weekly Signal 往期档案 — OPC圈"`
- [x] **验收:** `/news/signal` 路由正常渲染，空状态无报错，`npm run build` 通过

---

## Task 12: 单期详情页

**文件:** `app/(main)/news/signal/[n]/page.tsx`（新建）

- [x] Server Component，`export const revalidate = 3600`
- [x] 路由参数 `n` 为 issueNo，`parseInt(n)` 失败时 `notFound()`
- [x] 查询 `prisma.signalIssue.findUnique({ where: { issueNo: n, status: 'PUBLISHED' } })`，未找到 `notFound()`
- [x] `generateStaticParams`: 查所有 `status=PUBLISHED` 的 SignalIssue，返回 `[{ n: String(issueNo) }]`
- [x] `generateMetadata`: `title = \`Weekly Signal 第${n}期 | ${title} — OPC圈\``

**页面结构（从上到下）：**
- [x] 顶部导航行：「← 返回洞察」(`/news`) + 「往期档案」(`/news/signal`)，两个链接用 `flex justify-between`
- [x] Header 区：期号徽章 + 大标题（text-2xl md:text-3xl font-bold）+ 日期时间（publishedAt 格式 YYYY-MM-DD，activityTime 若有则追加显示）
- [x] `<SignalParticipants participants={...} />` 组件
- [x] 导读（intro）：若有，用 `bg-primary/5 border-l-4 border-primary px-4 py-3 text-ink text-sm` 渲染
- [x] 各 Section 按 `sections` 数组顺序渲染，每个 section 前加板块标题分隔行（橙色竖条 + 类型名）：
  - `hot_topic` → `<HotTopicSection>`
  - `policy` → `<PolicySection>`
  - `cases` → `<CasesSection>`
  - `resources` → `<ResourcesSection>`
  - `custom` → `<CustomSection>`
- [x] 底部：
  - 下期预告文字「每周四 12:00–13:00，线上腾讯会议」
  - 「我要投稿」按钮，外链 `https://jcndsl3lwezo.feishu.cn/share/base/form/shrcnWCpF295szJpvnTpVcgmyTc`，`target="_blank"`
- [x] **验收:** `/news/signal/[n]` 路由正常渲染，`npm run build` TypeScript 编译通过

---

## Task 13: 全量验收

- [x] `ls components/signal/` 确认以下 7 个文件均存在：
  `HotTopicSection.tsx`, `PolicySection.tsx`, `CasesSection.tsx`, `ResourcesSection.tsx`, `CustomSection.tsx`, `SignalParticipants.tsx`, `SignalBanner.tsx`
- [x] `ls app/api/signal/` 确认 `route.ts` 存在
- [x] `ls "app/api/signal/[n]/"` 确认 `route.ts` 存在
- [x] `ls "app/(main)/news/signal/"` 确认 `page.tsx` 存在
- [x] `ls "app/(main)/news/signal/[n]/"` 确认 `page.tsx` 存在
- [x] `npm run build` 通过，无 TypeScript 报错
- [x] dev server 启动后，`/news/signal` 路由渲染无报错（空状态显示提示文字）
- [x] `/api/signal` 返回合法 JSON（空数组或数组）
- [x] （手动）向数据库插入一条测试 SignalIssue 后，`/news/signal/[n]` 完整渲染所有板块组件
