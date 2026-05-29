# Phase 3 T6 (Remaining): Tab顺序 + 排序下拉 + 通知横条

## 背景

T6 的 Task 1（直通车表单）和 Tab 默认值已完成（commit 41812d6）。
本次完成剩余三项：Tab 顺序调整、排序下拉、通知横条。

**务必先读 `CLAUDE.md` 了解设计约束。**

---

## Task 1: Tab 顺序调整

文件: `components/plaza/plaza-client.tsx`

当前 tab 按钮顺序是 people → products → posts（第 472-509 行）。
改为: **products → posts → people**（产品 | 动态 | 创业者）。

只需要移动三个 `<button>` 块的顺序。

---

## Task 2: 排序下拉

文件: `components/plaza/plaza-client.tsx`, `app/api/plaza/projects/route.ts`

### 2.1 UI

在 tab 栏右侧（和 tab 按钮同行，靠右对齐）加一个小排序下拉。
三个 tab 各自的排序选项：

**产品 tab：**
- `latest`（默认）→ "最新发布"
- `likes` → "最多喜欢"
- `updated` → "最近更新"

**动态 tab：**
- `latest`（默认）→ "最新发布"
- `hot` → "最多互动"

**创业者 tab：**
- `latest`（默认）→ "最新加入"
- `followers` → "最多粉丝"

样式：`<select>` 元素，`text-sm text-mute bg-transparent border-0 focus:ring-0`
URL 持久化：`?tab=products&sort=likes`

### 2.2 API

修改 `app/api/plaza/projects/route.ts`：
- 接受 `sort` 查询参数
- `latest` → `orderBy: { createdAt: 'desc' }`
- `likes` → `orderBy: { likeCount: 'desc' }`
- `updated` → `orderBy: { updatedAt: 'desc' }`

创业者和动态的排序在 plaza-client.tsx 里用现有 API 参数传即可（如有）。

---

## Task 3: 通知横条

### 3.1 组件

创建 `components/plaza/notification-ticker.tsx`：
- 接收 `events: Array<{ text: string; time: Date }>` props
- 单行显示，高度固定 `h-10`
- CSS marquee 动画（`@keyframes marquee { from { transform: translateX(100%) } to { transform: translateX(-100%) } }`）
- 事件间用 " · " 分隔
- 无事件时静态显示："欢迎来到 OPC 创业者广场 🚀"
- 样式：`bg-surface-soft text-mute text-sm overflow-hidden`

### 3.2 数据查询

修改 `app/(main)/plaza/page.tsx`：
- 查询最近 24h：
  - 新 Project: `prisma.project.findMany({ where: { createdAt: { gte: 24h前 }, status: 'PUBLISHED' }, take: 5, select: { name: true, owner: { select: { name: true } } } })`
  - 新 Progress: `prisma.progress.findMany({ where: { createdAt: { gte: 24h前 } }, take: 5, include: { author: { select: { name: true } } } })`
  - 新 User: `prisma.user.findMany({ where: { createdAt: { gte: 24h前 }, showInPlaza: true }, take: 5, select: { name: true } })`
- 生成事件文案：
  - "xxx 发布了新产品「产品名」"
  - "xxx 记录了新进展"
  - "xxx 加入了 OPC圈"
- 按 createdAt 混合排序，取最新 8 条
- 传入 `<NotificationTicker events={events} />`
- 放在 tab 栏上方

---

## 设计约束（硬规则）

- 只用现有 Tailwind tokens（primary=#F97316, text-ink/body/mute/ash, bg-surface-soft/surface-card/canvas）
- 不引入新 npm 包
- 不新增 Tailwind 自定义颜色或 inline style
- 间距 4px 倍数
- Import Prisma from `@/lib/db`

## 验收标准

- `npm run build` 通过
- Tab 顺序为 产品 | 动态 | 创业者
- 每个 tab 有排序下拉
- 广场顶部有通知横条
