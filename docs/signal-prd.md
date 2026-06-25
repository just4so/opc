# Signal PRD — OPC Weekly Signal 功能模块

> 版本：v1.0 | 日期：2026-06-25 | 作者：闹闹虾
> 本文档是 ACP 任务的权威参考，每个 Milestone 开始前必须读此文档。

---

## 一、背景与目标

OPC Weekly Signal 是 OPC 圈每周固定的社区情报活动（每周四 12:00–13:00，线上腾讯会议）。
目标是将每期活动内容作为常态化内容接入 opcquan.com，归属在「洞察」板块（原「资讯」）下。

**核心原则：**
- 每期内容由人工整理，DeepSeek API 解析 HTML → 结构化入库，后台人工预览确认后发布
- 数据结构必须弹性，不能卡死每期的板块数量
- 现阶段归属在 `/news` 路由下，未来数据够多后独立为导航项

---

## 二、涉及的全部改动清单

### 数据库
- `News` 表新增 `hidden Boolean @default(false)` 字段
- 新增 `SignalIssue` 模型（见下方 Schema）
- 数据迁移：将所有 `isOriginal=false` 的 News 记录设为 `hidden=true`

### 前台路由（新增）
- `/news` — 页面重构（导航改名「洞察」，主页新布局）
- `/news/signal` — Signal 往期列表页
- `/news/signal/[n]` — 每期详情页

### 后台路由（新增）
- `/admin/signal` — Signal 列表管理
- `/admin/signal/new` — 上传 HTML 解析入库
- `/admin/signal/[id]` — 预览 + 发布/下架

### API 路由（新增）
- `GET /api/signal` — 公开，返回已发布期列表
- `GET /api/signal/[n]` — 公开，返回单期详情
- `POST /api/admin/signal/parse` — staff，接收 HTML 文本，调用 DeepSeek 返回 JSON
- `POST /api/admin/signal` — staff，保存草稿
- `PATCH /api/admin/signal/[id]` — staff，更新状态（发布/下架）
- `DELETE /api/admin/signal/[id]` — staff，删除

### 导航改动
- `components/layout/nav-links.tsx`：`资讯` → `洞察`，href 不变（`/news`）
- `components/layout/mobile-menu.tsx`：同上
- `app/admin/admin-nav.tsx`：CONTENT_ITEMS 新增 Signal 管理入口

---

## 三、数据库 Schema

```prisma
model SignalIssue {
  id           String        @id @default(cuid())
  issueNo      Int           @unique
  title        String
  publishedAt  DateTime
  activityTime String?       // "12:00-13:00"
  status       SignalStatus  @default(DRAFT)
  intro        String?       // 本期导读（多段合并）
  participants Json          // Participant[]
  sections     Json          // Section[]（弹性结构，见下方类型定义）
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("signal_issues")
}

enum SignalStatus {
  DRAFT
  PUBLISHED
}
```

### participants 类型定义

```typescript
type Participant = {
  name: string
  city: string
  roleLabel: string      // "OPC圈昆明主理人"
  roleType: 'host' | 'speaker'
}
```

### sections 类型定义

sections 是一个数组，每个元素是以下类型之一：

```typescript
// 热词信号
type HotTopicSection = {
  type: 'hot_topic'
  slot: string            // "A" | "B" | "C" ...
  title: string
  subtitle: string
  intro?: string
  points: Array<{
    seq: number
    heading: string
    body: string
    url: string | null
  }>
  claim: string           // 一句话主张
  observations: string[]  // 观察点列表
  opc_use: Array<{
    role: string          // "技术人" | "决策者" | "投资者" 等，自由值
    text: string
  }>
}

// 政策波段
type PolicySection = {
  type: 'policy'
  items: Array<{
    ptype: string         // "国家级" | "地方" | "金融" 等
    content: string
    impact: string
    url: string | null
  }>
}

// 实战信号
type CasesSection = {
  type: 'cases'
  items: Array<{
    title: string
    caseType: string      // "OPC实践" | "商业实践" | "社区政策" | "其他"
    name: string
    city: string
    roleLabel: string
    background: string
    action: string
    result: string
    advice: string
    contact: string | null
  }>
}

// 资源广播
type ResourcesSection = {
  type: 'resources'
  items: Array<{
    rtype: string         // "OPC社区" | "活动招募" | "项目合作" | "招聘兼职" 等
    content: string
    publisher: string
    url: string | null
    urlLabel: string | null
  }>
}

// 自定义（未来扩展，兜底）
type CustomSection = {
  type: 'custom'
  label: string
  content: string
}

type Section = HotTopicSection | PolicySection | CasesSection | ResourcesSection | CustomSection
```

---

## 四、DeepSeek 解析逻辑

### 入口
`POST /api/admin/signal/parse`
- 接收：`{ html: string }` （HTML 文件内容）
- 返回：`{ data: SignalIssueData }` 或 `{ error: string }`

### 调用配置
- 接口：`https://llm.ziy.cc/v1/chat/completions`
- 模型：`DeepSeek-V3.2`
- API Key：从环境变量 `KUNPO_API_KEY` 读取
- temperature：0.1
- max_tokens：4000

### HTML 预处理
调用前需将 HTML 转为结构化文本（去除 script/style，保留 h1-h6/p/li/td 结构标记），控制在 12000 字符以内。

### DeepSeek Prompt 模板

```
你是一个数据结构化专家。下面是一期「OPC Weekly Signal」活动的页面文本内容。

请将其解析为以下 JSON 结构，严格按照 schema 输出，不要加任何解释：

{
  "issueNo": <整数，期号>,
  "title": "<本期大标题>",
  "publishedAt": "<ISO日期，如 2026-06-25>",
  "activityTime": "<活动时间，如 12:00-13:00>",
  "intro": "<本期导读，多段合并为一段字符串，可为null>",
  "participants": [
    {"name":"<姓名>","city":"<城市>","roleLabel":"<身份描述>","roleType":"<host|speaker>"}
  ],
  "sections": [ ... ]
}

注意：
1. 只输出 JSON，不要 markdown 代码块，不要解释
2. 主持人 roleType 为 host，分享人为 speaker
3. 如果姓名和昵称连在一起（如「糊糊 刘梦然」），拆分为两个独立参与者
4. 没有的板块不要包含在 sections 里
5. 链接用原始 URL，没有的填 null
6. 字符串内不要有换行符，用空格代替

[完整 sections schema 见代码 lib/signal/prompt.ts]

页面内容：
{TEXT}
```

---

## 五、前台页面规格

### 5.1 `/news` 洞察主页

**渲染策略：** ISR，revalidate: 600

**页面结构（从上到下）：**
1. PageHeader：标题「创业洞察」，副标题「OPC 创业者的情报中心」，theme="news"
2. **Signal 横幅**（仅当有已发布 Signal 时显示）：
   - 全宽卡片，展示最新一期：期号 + 标题 + 日期 + 参与城市标签
   - 右侧「查看本期 →」按钮，链接到 `/news/signal/[n]`
3. 分类筛选 Tab（保留现有逻辑，isOriginal=true 的内容）
4. **OPC 圈原创**区块（无筛选时展示，仅 isOriginal=true）
5. 原创文章列表（现有 NewsCard 组件）
6. **政策库**（现有 PoliciesBlock 组件，不动）
7. **Signal 往期入口**：小卡片，「查看所有 Signal 往期档案 →」

**数据查询变化：**
- 所有 News 查询加 `WHERE hidden = false`
- 新增：查 `SignalIssue` 最新一条 `status=PUBLISHED`

### 5.2 `/news/signal` 往期列表页

**渲染策略：** ISR，revalidate: 300

**内容：**
- PageHeader：「Weekly Signal · 往期档案」
- 每期一行：期号 + 大标题 + 日期 + 参与城市标签 + 「查看」链接
- 最新一期置顶，加「NEW」标签

### 5.3 `/news/signal/[n]` 详情页

**渲染策略：** ISR，revalidate: 3600

**页面结构：**
1. 顶部：「← 返回洞察」 + 「← 往期」导航
2. Header 区：期号徽章 + 大标题 + 日期时间
3. 参与人员卡片行：每人显示姓名 + 城市 + 身份 + 角色标签（主持人/分享人）
4. 页内目录（固定侧边栏或顶部锚点导航，移动端折叠）
5. 各 Section 按 sections 数组顺序渲染，对应组件：
   - `hot_topic` → `<HotTopicSection>`
   - `policy` → `<PolicySection>`
   - `cases` → `<CasesSection>`
   - `resources` → `<ResourcesSection>`
   - `custom` → `<CustomSection>`（兜底）
6. 底部：下期预告（时间 + 投稿入口按钮）+ 渠道入口（微信群/腾讯会议/公众号）

**组件文件路径：**
```
components/signal/
  HotTopicSection.tsx
  PolicySection.tsx
  CasesSection.tsx
  ResourcesSection.tsx
  CustomSection.tsx
  SignalParticipants.tsx
  SignalBanner.tsx        ← 洞察主页横幅复用
```

---

## 六、后台页面规格

### 6.1 `/admin/signal` 列表页

- 表格：期号 / 标题 / 日期 / 状态（草稿/已发布）/ 操作
- 操作：预览 / 发布（草稿状态）/ 下架（已发布状态）/ 删除
- 「新建期号」按钮 → 跳转 `/admin/signal/new`
- 权限：requireStaff()（ADMIN + MODERATOR 均可访问）

### 6.2 `/admin/signal/new` 新建页

**操作流程：**
1. 粘贴或上传 HTML 内容（textarea 或 file input）
2. 点击「AI 解析」→ 调用 `POST /api/admin/signal/parse`
3. 显示解析结果预览（只读，JSON 渲染为可读格式）
4. 「保存草稿」→ 写入 DB，status=DRAFT
5. 跳转到 `/admin/signal/[id]` 预览页

**错误处理：**
- 解析失败显示错误信息，允许重试
- 保存前校验：issueNo 不重复、title 不为空

### 6.3 `/admin/signal/[id]` 预览+发布页

- 完整渲染该期内容（与前台 `/news/signal/[n]` 一致的视图）
- 顶部操作栏：状态徽章 + 「发布」或「下架」按钮 + 「删除」按钮
- 发布后跳转到前台 `/news/signal/[issueNo]`

---

## 七、admin-nav 改动

在 `CONTENT_ITEMS` 数组中新增：
```typescript
{ href: '/admin/signal', label: 'Signal 管理', icon: <Radio className="h-4 w-4" /> }
```

---

## 八、环境变量

`KUNPO_API_KEY` — 已在 `.env.local` 和生产环境配置，供 DeepSeek API 调用使用。
CVM 部署时需在 `~/opc/.env` 中同步添加此变量。

---

## 九、Milestone 拆分

### M1 — DB + 数据迁移（先做，其他 M 依赖它）

**文件：**
1. `prisma/schema.prisma` — 新增 `SignalIssue` 模型 + `SignalStatus` enum + `News` 加 `hidden` 字段
2. `prisma/migrations/[timestamp]_signal_news_hidden/migration.sql` — migration 文件
3. `scripts/hide-rss-news.ts` — 一次性脚本：将 `isOriginal=false` 的 News 设为 `hidden=true`

**验收：**
- `npx prisma migrate dev` 成功
- `npx tsx scripts/hide-rss-news.ts` 执行后，前台资讯页只显示原创内容

### M2 — Signal 前台

**文件：**
1. `components/signal/HotTopicSection.tsx`
2. `components/signal/PolicySection.tsx`
3. `components/signal/CasesSection.tsx`
4. `components/signal/ResourcesSection.tsx`
5. `components/signal/SignalParticipants.tsx`
6. `components/signal/SignalBanner.tsx`
7. `app/(main)/news/signal/page.tsx` — 往期列表
8. `app/(main)/news/signal/[n]/page.tsx` — 详情页

**验收：**
- `/news/signal` 正常渲染（空状态：「暂无期号」）
- 手动插入一条测试数据后，`/news/signal/1` 完整渲染所有板块

### M3 — 洞察主页重构 + 后台

**文件：**
1. `components/layout/nav-links.tsx` — 资讯→洞察
2. `components/layout/mobile-menu.tsx` — 同上
3. `app/(main)/news/page.tsx` — 主页加 Signal 横幅 + Signal 往期入口 + hidden 过滤
4. `components/news/news-client.tsx` — 同步 hidden 过滤
5. `app/admin/admin-nav.tsx` — 加 Signal 管理入口
6. `app/admin/signal/page.tsx` — 列表页
7. `app/admin/signal/new/page.tsx` — 新建+解析页
8. `app/admin/signal/[id]/page.tsx` — 预览+发布页
9. `app/api/admin/signal/parse/route.ts` — DeepSeek 解析 API
10. `app/api/admin/signal/route.ts` — 列表+创建 API
11. `app/api/admin/signal/[id]/route.ts` — 单条 CRUD API
12. `app/api/signal/route.ts` — 公开列表 API
13. `app/api/signal/[n]/route.ts` — 公开单期 API
14. `lib/signal/parse.ts` — HTML 预处理 + DeepSeek 调用逻辑
15. `lib/signal/prompt.ts` — Prompt 模板常量

**验收：**
- 导航显示「洞察」
- 洞察主页显示 Signal 横幅（有已发布 Signal 时）
- 后台 `/admin/signal` 可上传 HTML → 解析 → 预览 → 发布
- 发布后前台 `/news/signal/1` 正常访问

---

## 十、注意事项（给 ACP 的硬规则）

1. **无 src/ 目录**，所有文件直接在项目根目录下
2. **PostType 只用 SHARE/DEMAND/CHAT**，不要碰已废弃的 enum 值
3. **Prisma 从 `@/lib/db` 引入**，不要直接用 `@prisma/client`
4. **Date 对象序列化**：Server Component 传给 Client Component 前必须 `.toISOString()`
5. **Admin 权限**：使用 `requireStaff()` from `@/lib/admin`，不要自己写权限检查
6. **样式 token**：颜色用 `text-ink/text-mute/text-ash`，背景用 `bg-canvas/bg-surface-card`，不要硬编码颜色值（除非是 primary #F97316）
7. **ISR**：Signal 详情页 `revalidate = 3600`，列表页 `revalidate = 300`
8. **CVM 部署**：M1 完成后需在 CVM 上执行 migration，步骤：`scp schema.prisma` → `npx prisma generate` → `npx prisma migrate deploy`

---

_文档结束。如有变更，在修改代码前先更新此文档对应章节。_
