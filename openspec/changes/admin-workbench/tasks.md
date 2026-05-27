# admin-workbench: 后台运营工作台改造

## 背景

当前后台有两个核心问题：
1. **意向管理/认证管理只能看和改状态，不能编辑用户信息或上传 BP** — 运营者被迫让用户自己改，或者线下口头沟通后无法记录
2. **仪表盘是数据看板而非运营工作台** — 统计数字和快捷入口对日常运营没有行动指引

## 涉及文件概览

### 新增文件
- `components/admin/inquiry-drawer.tsx` — 意向详情编辑抽屉
- `components/admin/user-drawer.tsx` — 用户详情编辑抽屉（认证管理复用）
- `components/admin/activity-feed.tsx` — 仪表盘最近活动流
- `app/api/admin/inquiries/[id]/route.ts` — 意向单条编辑 API
- `app/api/admin/activity/route.ts` — 最近活动流 API

### 修改文件
- `app/api/admin/users/[id]/route.ts` — 扩展可编辑字段
- `app/admin/inquiries/inquiries-client.tsx` — 接入 Drawer
- `app/admin/verify/verify-client.tsx` — 接入 User Drawer
- `app/admin/page.tsx` — 仪表盘重写
- `prisma/schema.prisma` — Inquiry 加 adminNote 字段

---

## Phase 1: 数据层 + API

### Task 1.1: Prisma schema 加 adminNote 字段
- [ ] `prisma/schema.prisma`: Inquiry model 新增 `adminNote String?`
- [ ] 运行 `npm run db:push` 推送到数据库
- [ ] 运行 `npm run db:generate` 重新生成 Prisma client
- **验收:** `npx prisma db pull` 后 schema 含 adminNote 字段

### Task 1.2: 意向单条编辑 API — `app/api/admin/inquiries/[id]/route.ts`
- [ ] `GET` — 获取单条意向详情，include user（完整字段：id, username, name, email, bio, mainTrack, startupStage, location, avatar, verified, verifyType）+ community
- [ ] `PATCH` — 可编辑字段：name, contact, city, introduction, stage, bpUrl, bpFilename, adminNote, status
- [ ] 用 zod 校验：name min(1), contact min(1), city min(1), introduction max(500), stage max(100), adminNote max(1000)
- [ ] 鉴权：`requireStaffApi()`
- **验收:** `curl` 能成功 GET/PATCH 一条意向，返回完整数据

### Task 1.3: 扩展用户编辑 API — `app/api/admin/users/[id]/route.ts`
- [ ] PATCH 新增可编辑字段：bio(max 200), mainTrack(max 100), startupStage(max 50), location(max 100), name(max 50), website(max 200)
- [ ] 保留现有字段：role（仅 ADMIN）、verified、level
- [ ] 用 zod 校验，strict mode
- [ ] GET 方法：返回完整用户信息（包含 inquiries 最近 5 条、_count 统计）
- **验收:** `curl PATCH` 能更新 bio/mainTrack 等字段

### Task 1.4: 管理员 BP 上传 — 复用 `app/api/upload/bp/route.ts`
- [ ] 当前 BP 上传 API 已有 `auth()` 校验，staff 也是登录用户，无需额外改动
- [ ] 在意向编辑 Drawer 里调用同一个 API 获取 presigned URL，上传后 PATCH 意向的 bpUrl/bpFilename
- **验收:** 无代码改动，确认 staff 用户能成功调用 `/api/upload/bp`

### Task 1.5: 最近活动流 API — `app/api/admin/activity/route.ts`
- [ ] GET 方法，返回最近 20 条活动（union 查询）
- [ ] 数据来源：新注册用户(User.createdAt)、新意向(Inquiry.createdAt)、新帖子(Post.createdAt, status=PUBLISHED)、新认领(CommunityClaim.createdAt)
- [ ] 每条返回：`{ type: 'user'|'inquiry'|'post'|'claim', title: string, subtitle: string, time: string, link: string }`
- [ ] 四个来源各取最近 10 条，合并后按时间倒序取前 20
- [ ] 鉴权：`requireStaffApi()`
- **验收:** API 返回混合时间线，类型和时间正确

---

## Phase 2: 前端组件

### Task 2.1: 意向详情编辑 Drawer — `components/admin/inquiry-drawer.tsx`
- [ ] 右侧弹出 Drawer（固定宽度 480px，遮罩层），动画从右滑入
- [ ] 打开时调用 `GET /api/admin/inquiries/[id]` 获取详情
- [ ] **意向信息区：** 称呼、联系方式、城市、意向社区（只读）、方向(introduction)、阶段(stage) — 全部可编辑（inline edit 或 form 模式）
- [ ] **BP 区：** 显示已有 BP 文件名+下载链接；上传/替换按钮（调用 `/api/upload/bp` 获取 presigned URL → PUT 文件 → PATCH 意向 bpUrl/bpFilename）
- [ ] **用户信息区：** 显示关联用户的 bio、mainTrack、startupStage；每个字段旁边有编辑按钮，编辑后调用 `PATCH /api/admin/users/[userId]`
- [ ] **内部备注区：** textarea，保存到 Inquiry.adminNote
- [ ] **状态操作区：** 状态下拉切换（PENDING→CONTACTED→DONE→CANCELLED）
- [ ] **底部按钮：** 保存（batch 提交意向字段改动）+ 关闭
- [ ] Loading 态、Error 态、保存成功 Toast
- **验收:** 打开 Drawer → 修改字段 → 保存 → 刷新列表看到更新

### Task 2.2: 用户详情编辑 Drawer — `components/admin/user-drawer.tsx`
- [ ] 右侧弹出 Drawer（480px），与 inquiry-drawer 视觉风格一致
- [ ] 打开时调用 `GET /api/admin/users/[id]` 获取用户详情
- [ ] **用户信息区：** 头像（只读）、name、username（只读）、email（只读）、bio、location、mainTrack、startupStage、website — 可编辑字段用 inline edit
- [ ] **认证区：** 当前认证状态 + 认证类型选择 + 认证/取消认证按钮（复用 verify API）
- [ ] **历史意向区：** 显示该用户最近 5 条意向记录（状态 badge + 社区名 + 时间），点击可跳转意向管理
- [ ] **统计区：** 帖子数、评论数、注册时间
- [ ] Loading 态、Error 态、保存成功 Toast
- **验收:** 从认证管理列表点击用户 → Drawer 弹出 → 编辑 bio → 保存 → 认证 → 刷新看到更新

### Task 2.3: 接入意向管理列表 — `app/admin/inquiries/inquiries-client.tsx`
- [ ] 表格每行点击（或添加"详情"按钮）→ 打开 InquiryDrawer
- [ ] Drawer 关闭时刷新列表（调用 fetchInquiries）
- [ ] 保留现有的状态下拉直接切换能力（列表内快速操作）
- **验收:** 列表点击行 → Drawer 弹出 → 修改保存 → 列表自动刷新

### Task 2.4: 接入认证管理列表 — `app/admin/verify/verify-client.tsx`
- [ ] 表格每行用户名点击 → 打开 UserDrawer
- [ ] Drawer 内直接操作认证（不再需要弹 Dialog）
- [ ] 删除现有的 Verify Dialog（dialogUser 状态及相关 UI）
- [ ] Drawer 关闭时刷新列表
- **验收:** 点击用户 → Drawer 弹出 → 编辑+认证 → 列表自动刷新

---

## Phase 3: 仪表盘重写

### Task 3.1: 活动流组件 — `components/admin/activity-feed.tsx`
- [ ] 调用 `GET /api/admin/activity` 获取数据
- [ ] 时间线布局：左侧时间、右侧事件卡片
- [ ] 每种类型不同图标+颜色：用户(蓝)、意向(橙)、帖子(绿)、认领(紫)
- [ ] 点击跳转到对应详情/管理页
- [ ] 空状态：「暂无最近活动」
- **验收:** 组件渲染混合时间线，图标颜色区分，点击跳转正确

### Task 3.2: 仪表盘重写 — `app/admin/page.tsx`
- [ ] **第一层：待办事项卡片**（有待办才显示对应卡片，全部为 0 显示 ✅ 提示）
  - 待跟进意向（Inquiry status=PENDING count）→ `/admin/inquiries?status=PENDING`
  - 待处理认领（CommunityClaim status=PENDING count）→ `/admin/communities?tab=claims`
  - 待认证用户（User showInPlaza=true, verified=false count）→ `/admin/verify`
- [ ] **第二层：今日动态**（4 小指标，灰色调，不突出）
  - 今日新注册、今日新意向、今日新帖子、今日新认领
- [ ] **第三层：最近活动流**（ActivityFeed 组件）
- [ ] 删除现有内容：统计卡片（用户总数/帖子总数等 6 张）、快捷操作区、趋势图
- [ ] 保留 TrendChart 组件文件不删（以后可能加回来），但从仪表盘移除
- **验收:** 仪表盘只有三层：待办 → 今日动态 → 活动流；无统计卡片和快捷操作

---

## Phase 4: 构建验证

### Task 4.1: TypeScript + Build 验证
- [ ] `npx tsc --noEmit` 0 错误
- [ ] `npm run build` 通过
- **验收:** 构建无错误

---

## 技术约束（Claude Code 必读）

1. **鉴权：** admin API 统一用 `requireStaffApi()` / `requireAdminApi()`（从 `@/lib/admin` 导入），不要用 `auth()` + `isStaff()` 组合
2. **Prisma：** import from `@/lib/db`，Date 字段传给前端前 `.toISOString()`
3. **组件：** Drawer 用 tailwind 手写（fixed right-0 + transition），不引入新 UI 库
4. **样式：** 遵循 DESIGN.md token（text-ink, text-mute, bg-surface-soft 等），admin 已有灰白主题保持一致
5. **文件路径：** 项目根目录是 `/Users/wei/Documents/opc`，没有 `src/` 目录
6. **BP 上传：** 复用 `/api/upload/bp` 现有逻辑（presigned URL → PUT → 回填 URL）
7. **Toast：** 项目已有 `components/ui/toast-notification.tsx`，直接用
8. **Zod：** 校验 schema 写在 API 路由文件内（和现有模式一致），不新建 validation 文件
