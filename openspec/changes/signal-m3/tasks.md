# signal-m3 — 洞察主页重构 + 后台 Signal 管理

> PRD 参考：docs/signal-prd.md §5.1、§6、§7、§8、§9 M3
> 依赖：M1（DB + hidden 字段）、M2（components/signal/ 组件）均已完成

---

## T1 — 导航改名（2 个文件）

### 验收标准

- [x] `components/layout/nav-links.tsx` line 7：`label: '资讯'` → `label: '洞察'`
- [x] `components/layout/mobile-menu.tsx` line 13：`label: '资讯'` → `label: '洞察'`
- [x] 桌面端导航栏显示「洞察」
- [x] 移动端菜单抽屉显示「洞察」
- [x] 链接 href 保持 `/news`，不变
- [x] `npm run build` 无 TS 报错
- [x] `git diff --name-only HEAD` 仅包含上述 2 个文件

---

## T2 — 洞察主页数据层（`app/(main)/news/page.tsx`）

### 改动说明

当前 `getDefaultNews` 缓存函数和非默认视图的直接查询均未过滤 `hidden: true` 的记录，且未查询最新 Signal。

### 具体改动

1. `prisma.news.findMany` 的 `where` 加 `hidden: false`（defaultNews、非默认视图、originals 三处）
2. `prisma.news.count` 的 `where` 加 `hidden: false`（同两处）
3. 新增独立查询 `latestSignal`（不在 `unstable_cache` 内，单独按需查）：
   ```ts
   const latestSignal = await prisma.signalIssue.findFirst({
     where: { status: 'PUBLISHED' },
     orderBy: { issueNo: 'desc' },
     select: { issueNo: true, title: true, publishedAt: true, participants: true },
   })
   ```
4. `publishedAt` 序列化：`latestSignal?.publishedAt.toISOString()`
5. 将 `latestSignal`（或 null）作为 prop 传给 `<NewsClient>`

### 验收标准

- [x] 所有 `prisma.news.findMany` 调用含 `where: { hidden: false, ... }`
- [x] 所有 `prisma.news.count` 调用含 `where: { hidden: false, ... }`
- [x] `latestSignal` 查询存在，字段：`issueNo / title / publishedAt / participants`
- [x] `publishedAt` 传给 Client 前已序列化为字符串（`.toISOString()`）
- [x] `NewsClient` 接收 `latestSignal` prop
- [x] `npm run build` 无 TS 报错

---

## T3 — 洞察主页视图层（`components/news/news-client.tsx`）

### 具体改动

1. 新增 prop 类型：
   ```ts
   latestSignal?: {
     issueNo: number
     title: string
     publishedAt: string
     participants: any[]
   } | null
   ```
2. `PageHeader` 的 `title` 改为：`创业<span className="text-primary">洞察</span>`，`subtitle` 改为 `OPC 创业者的情报中心`
3. 在 PageHeader 下方、分类筛选 Tab 上方插入：
   ```tsx
   {latestSignal && <SignalBanner issue={latestSignal} />}
   ```
   `SignalBanner` 从 `@/components/signal/SignalBanner` 导入（M2 已建）
4. 在政策库（PoliciesBlock）之后插入 Signal 往期入口小卡片：
   ```tsx
   <div className="mt-8">
     <Link href="/news/signal" className="...">
       查看所有 Weekly Signal 往期档案 →
     </Link>
   </div>
   ```
   样式：`flex items-center justify-between p-4 bg-surface-card rounded-2xl border border-hairline-soft hover:shadow-sm transition-shadow`

### 验收标准

- [x] `PageHeader` title 含 `<span className="text-primary">洞察</span>`，subtitle 为「OPC 创业者的情报中心」
- [x] 有已发布 Signal 时，`SignalBanner` 渲染在分类筛选上方
- [x] 无已发布 Signal 时，该区域不渲染（无空白占位）
- [x] Signal 往期入口链接 `href="/news/signal"` 位于政策库之后
- [x] 颜色只用语义 token（`text-ink / text-mute / bg-surface-card` 等），无 hex 硬编码
- [x] 圆角用 `rounded-2xl` 或 `rounded-full`，不用 `rounded-xl / rounded-lg / rounded-md`
- [x] `npm run build` 无 TS 报错

---

## T4 — News API hidden 过滤（`app/api/news/route.ts`）

### 具体改动

在 `where` 对象初始化处加 `hidden: false` 基础条件：
```ts
const where: any = { hidden: false }
```
（`prisma.news.findMany` 和 `prisma.news.count` 共用同一个 `where`，改一处即可）

### 验收标准

- [x] `where` 初始值为 `{ hidden: false }` 而非 `{}`
- [x] 原有 `category / original / search` 条件叠加逻辑不变
- [x] `npm run build` 无 TS 报错

---

## T5 — 后台 admin-nav（`app/admin/admin-nav.tsx`）

### 具体改动

在 `CONTENT_ITEMS` 数组「雷达管理」条目后追加：
```ts
{ href: '/admin/signal', label: 'Signal 管理', icon: <Radio className="h-4 w-4" /> }
```
`Radio` 已从 `lucide-react` 导入（现有代码已有该导入）。

### 验收标准

- [x] `CONTENT_ITEMS` 包含 `Signal 管理` 条目，href 为 `/admin/signal`
- [x] 图标为 `<Radio className="h-4 w-4" />`，与「雷达管理」图标一致
- [x] 侧边栏「内容管理」分组中「Signal 管理」显示在「雷达管理」之后
- [x] 访问 `/admin/signal/*` 时该菜单项高亮（`isActive` 逻辑已自动覆盖）
- [x] `npm run build` 无 TS 报错

---

## T6 — lib/signal/prompt.ts（新建）

### 文件路径

`lib/signal/prompt.ts`

### 内容要求

导出常量 `PARSE_PROMPT: string`，内容为完整 DeepSeek 解析 prompt（见 docs/signal-prd.md §4），包含：
- 系统指令（角色：数据结构化专家）
- 完整 JSON schema 说明（issueNo / title / publishedAt / activityTime / intro / participants / sections）
- sections 各类型（hot_topic / policy / cases / resources / custom）的字段说明
- 6 条注意事项
- 末尾占位符 `{TEXT}` 用于替换实际内容

### 验收标准

- [x] 文件存在于 `lib/signal/prompt.ts`
- [x] 导出名为 `PARSE_PROMPT`，类型为 `string`
- [x] Prompt 包含 `{TEXT}` 占位符
- [x] Prompt 包含 hot_topic / policy / cases / resources 四种 section type 说明
- [x] `npm run build` 无 TS 报错

---

## T7 — lib/signal/parse.ts（新建）

### 文件路径

`lib/signal/parse.ts`

### 导出内容

```ts
export async function parseSignalHtml(html: string): Promise<SignalIssueData>
```

`SignalIssueData` 类型应内联定义或从类型文件引入，字段对应 PRD §3 的 SignalIssue 输入结构（不含 id/status/createdAt/updatedAt）。

### 实现步骤

1. **HTML 预处理**
   - 去除 `<script>` / `<style>` / `<head>` 标签及其内容
   - 保留 `h1-h6 / p / li / td / th` 的文本，加换行符
   - 去除所有剩余 HTML 标签（正则 `/<[^>]+>/g`）
   - 截断到 12000 字符

2. **调用 DeepSeek**（用原生 `fetch`，不引入第三方库）
   ```ts
   const res = await fetch('https://llm.ziy.cc/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: `Bearer ${process.env.KUNPO_API_KEY}`,
     },
     body: JSON.stringify({
       model: 'DeepSeek-V3.2',
       temperature: 0.1,
       max_tokens: 4000,
       messages: [{ role: 'user', content: PARSE_PROMPT.replace('{TEXT}', processedText) }],
     }),
   })
   ```

3. **响应清理**
   - 取 `choices[0].message.content`
   - 去除 markdown 代码块包裹（` ```json ` / ` ``` `）
   - `JSON.parse` 并返回

4. **错误处理**：`fetch` 失败或 JSON parse 失败时抛出 `Error`，由调用方捕获

### 验收标准

- [x] 文件存在于 `lib/signal/parse.ts`
- [x] 导出 `parseSignalHtml` 函数，签名符合规格
- [x] HTML 预处理：去除 script/style，截断 12000 字符
- [x] DeepSeek 调用 URL 为 `https://llm.ziy.cc/v1/chat/completions`
- [x] 模型名为 `DeepSeek-V3.2`，temperature `0.1`，max_tokens `4000`
- [x] API Key 从 `process.env.KUNPO_API_KEY` 读取，**不硬编码**
- [x] 使用 `PARSE_PROMPT` from `./prompt`
- [x] 去除 markdown 代码块后再 `JSON.parse`
- [x] `npm run build` 无 TS 报错

---

## T8 — API: POST /api/admin/signal/parse（新建）

### 文件路径

`app/api/admin/signal/parse/route.ts`

### 实现规格

```ts
export async function POST(req: Request) {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const { html } = await req.json()
  if (!html || typeof html !== 'string') {
    return NextResponse.json({ error: '缺少 html 参数' }, { status: 400 })
  }

  const data = await parseSignalHtml(html) // from lib/signal/parse.ts
  return NextResponse.json({ data })
}
```

错误统一返回 `{ error: string }`，status 500。

### 验收标准

- [x] 文件存在于 `app/api/admin/signal/parse/route.ts`
- [x] 使用 `requireStaffApi()` from `@/lib/admin`
- [x] 接收 `{ html: string }`，缺少时返回 400
- [x] 调用 `parseSignalHtml` from `@/lib/signal/parse`
- [x] 成功返回 `{ data: SignalIssueData }`
- [x] 异常返回 `{ error: string }` + status 500
- [x] `npm run build` 无 TS 报错

---

## T9 — API: GET/POST /api/admin/signal（新建）

### 文件路径

`app/api/admin/signal/route.ts`

### GET — 列表

- 权限：`requireStaffApi()`
- 查询：`prisma.signalIssue.findMany({ orderBy: { issueNo: 'desc' }, select: { id, issueNo, title, publishedAt, status } })`
- 返回：`{ data: SignalIssue[] }`

### POST — 创建草稿

- 权限：`requireStaffApi()`
- 接收：`SignalIssueData`（issueNo / title / publishedAt / activityTime / intro / participants / sections）
- 写入：`prisma.signalIssue.create({ data: { ...body, status: 'DRAFT' } })`
- publishedAt：接收 ISO 字符串，写入前 `new Date(body.publishedAt)`
- 返回：`{ id: string }`

### 验收标准

- [x] GET 返回按 issueNo 倒序排列的列表（含 id / issueNo / title / publishedAt / status）
- [x] POST 创建记录，status 固定为 `DRAFT`
- [x] POST 写入 DB 后返回 `{ id }`
- [x] `participants` / `sections` 字段以 JSON 形式写入（Prisma Json 类型）
- [x] `publishedAt` 正确转为 `Date` 对象写入 DB
- [x] 两个 handler 均有 `requireStaffApi()` 权限检查
- [x] `npm run build` 无 TS 报错

---

## T10 — API: GET/PATCH/DELETE /api/admin/signal/[id]（新建）

### 文件路径

`app/api/admin/signal/[id]/route.ts`

### GET — 单条详情

- `prisma.signalIssue.findUnique({ where: { id } })`
- 不存在返回 404

### PATCH — 更新状态

- 接收：`{ status: 'PUBLISHED' | 'DRAFT' }`
- `prisma.signalIssue.update({ where: { id }, data: { status } })`
- 返回：`{ ok: true }`

### DELETE — 删除

- `prisma.signalIssue.delete({ where: { id } })`
- 返回：`{ ok: true }`

### 验收标准

- [x] GET 返回完整 SignalIssue 记录（含 participants / sections JSON）
- [x] GET 不存在时返回 404
- [x] PATCH 只允许 `status` 字段变更，其他字段忽略
- [x] DELETE 成功返回 `{ ok: true }`
- [x] 三个 handler 均有 `requireStaffApi()` 权限检查
- [x] `npm run build` 无 TS 报错

---

## T11 — API: GET /api/signal 和 /api/signal/[n]（新建，公开）

### 文件路径

- `app/api/signal/route.ts`
- `app/api/signal/[n]/route.ts`

### /api/signal GET — 公开列表

- `prisma.signalIssue.findMany({ where: { status: 'PUBLISHED' }, orderBy: { issueNo: 'desc' }, select: { id, issueNo, title, publishedAt, participants } })`
- 返回：`{ data: SignalIssue[] }`
- `revalidate = 300`

### /api/signal/[n] GET — 公开单期

- `n` 为 issueNo（整数）
- `prisma.signalIssue.findUnique({ where: { issueNo: parseInt(n) } })`
- `where: { status: 'PUBLISHED' }`（未发布不返回）
- 不存在返回 404
- `revalidate = 3600`

### 验收标准

- [x] `/api/signal` 只返回 status=PUBLISHED 的记录
- [x] `/api/signal/[n]` 以 issueNo 查询，非 id
- [x] 未发布的 Signal 通过公开 API 查询返回 404
- [x] 两个路由均无权限要求（public）
- [x] `npm run build` 无 TS 报错

---

## T12 — 后台 Signal 列表页（`app/admin/signal/page.tsx`）

### 规格

- Server Component，`export const dynamic = 'force-dynamic'`
- 调用 `requireStaff()` from `@/lib/admin`
- 直接 Prisma 查询：`prisma.signalIssue.findMany({ orderBy: { issueNo: 'desc' } })`
- 表格列：期号 / 标题 / 日期（`publishedAt` 格式化为 `YYYY-MM-DD`）/ 状态（草稿/已发布）/ 操作
- 操作列：
  - 「预览」链接 → `/admin/signal/[id]`
  - 「删除」使用 `<form action="..." method="POST">` 或 Client 组件触发 DELETE
- 顶部：`<Link href="/admin/signal/new">新建期号</Link>` 按钮

### 验收标准

- [x] 页面可访问（无 500 / 白屏）
- [x] 表格展示期号 / 标题 / 日期 / 状态
- [x] 状态显示为「草稿」或「已发布」
- [x] 「新建期号」按钮存在并链接到 `/admin/signal/new`
- [x] 「预览」链接到对应的 `/admin/signal/[id]`
- [x] `requireStaff()` 调用存在
- [x] `npm run build` 无 TS 报错

---

## T13 — 后台 Signal 新建页（`app/admin/signal/new/page.tsx`）

### 规格

- `'use client'`
- 用 `useSession()` 做前端权限检查（role 不是 ADMIN/MODERATOR 则跳转 `/admin`）
- UI 元素：
  1. `<textarea>` 粘贴 HTML，placeholder「粘贴 Weekly Signal HTML 页面内容」，`rows={20}`
  2. 「AI 解析」`<Button>` → `POST /api/admin/signal/parse`，loading 状态（按钮文字改为「解析中…」，禁用）
  3. 解析结果展示区（只读）：显示期号、标题、日期、参与者数量、各 section 类型及数量（人类可读摘要，非原始 JSON）
  4. 「保存草稿」`<Button>` → `POST /api/admin/signal`，成功后 `router.push('/admin/signal/[id]')`
  5. 错误信息 `<p className="text-red-500">` 展示
- 所有按钮使用 `@/components/ui/button`

### 验收标准

- [x] textarea 可粘贴内容
- [x] 点击「AI 解析」触发 `POST /api/admin/signal/parse`，期间按钮 loading
- [x] 解析成功后显示摘要（期号 / 标题 / 日期 / 参与者数 / section 列表）
- [x] 解析失败显示错误信息，textarea 内容保留，可重试
- [x] 点击「保存草稿」触发 `POST /api/admin/signal`
- [x] 保存成功后跳转到 `/admin/signal/[id]`
- [x] 保存失败显示错误信息
- [x] KUNPO_API_KEY 不出现在前端代码中（仅后端 API 调用）
- [x] `npm run build` 无 TS 报错

---

## T14 — 后台 Signal 预览+发布页（`app/admin/signal/[id]/page.tsx`）

### 规格

- Server Component，`export const dynamic = 'force-dynamic'`
- 参数：`params.id`（cuid）
- 调用 `requireStaff()` from `@/lib/admin`
- 查询：`prisma.signalIssue.findUnique({ where: { id: params.id } })`，不存在返回 `notFound()`
- **顶部操作栏**（Client 组件 `SignalAdminActions`，内嵌或单独文件均可）：
  - 状态徽章：草稿（gray）/ 已发布（green）
  - 「发布」按钮（DRAFT 时）→ `PATCH /api/admin/signal/[id]` with `{ status: 'PUBLISHED' }`，成功后刷新
  - 「下架」按钮（PUBLISHED 时）→ `PATCH /api/admin/signal/[id]` with `{ status: 'DRAFT' }`
  - 「删除」按钮 → `DELETE /api/admin/signal/[id]`，确认后执行，成功跳转 `/admin/signal`
- **正文**：复用 `components/signal/` 组件，与前台渲染一致
  - `<SignalParticipants participants={issue.participants} />`
  - 遍历 `issue.sections`，按 type 分发到对应组件
  - 组件从 M2 的 `components/signal/` 导入

### 验收标准

- [x] 页面可访问，正文渲染各 section 内容
- [x] 状态徽章正确展示「草稿」/「已发布」
- [x] 「发布」按钮仅在 DRAFT 时显示，点击后触发 PATCH API
- [x] 「下架」按钮仅在 PUBLISHED 时显示，点击后触发 PATCH API
- [x] 「删除」按钮点击后有二次确认，确认后删除并跳转 `/admin/signal`
- [x] 不存在的 id 返回 404（`notFound()`）
- [x] `requireStaff()` 调用存在
- [x] 正文复用 `components/signal/` 组件，不重复实现渲染逻辑
- [x] `npm run build` 无 TS 报错

---

## 最终整体验收

- [x] 导航显示「洞察」（桌面 + 移动端）
- [x] `/news` 主页 PageHeader title 含橙色「洞察」字
- [x] `/news` 主页有已发布 Signal 时显示 `SignalBanner`
- [x] `/news` 主页无已发布 Signal 时无占位空块
- [x] `/news` 主页底部有「查看所有 Signal 往期档案 →」入口
- [x] 后台侧边栏「内容管理」出现「Signal 管理」条目
- [x] `/admin/signal` 列表页正常访问
- [x] `/admin/signal/new` 可粘贴 HTML + 点击 AI 解析（即使 API 未配置也不崩溃）
- [x] `/admin/signal/[id]` 预览页正常访问，发布/下架按钮可操作
- [x] `KUNPO_API_KEY` 只在服务端代码（`lib/signal/parse.ts` 或 API route）中读取，从不出现在 Client Component
- [x] `npm run build` 通过，零 TypeScript 报错
- [x] `git diff --name-only HEAD` 改动文件不超出 M3 规定范围（共 15 个文件）
