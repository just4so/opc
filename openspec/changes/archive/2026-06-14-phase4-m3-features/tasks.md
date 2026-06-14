# Phase 4 M3: 其余功能（L系列 + N系列）

> Milestone: M3
> 状态: 待执行
> 前置条件: M1（DB迁移）+ M2（帖子类型重设计）已完成

---

## Tasks

### Task 1 — 直通车表单优化 + 成功页引导（L2 + N5）

**文件：**
- `components/connect/connect-form.tsx`
- `components/connect/success-view.tsx`

**改动：**

`connect-form.tsx`：
1. 微信号 → 手机号：Label 改 `手机号`，placeholder 改 `请输入手机号`（字段名保持 `wechat` 或改为 `phone`，以实际字段映射为准）
2. productTagline → 产品简介：Label 改 `产品简介`，placeholder 改 `用一两句话描述你在做什么（可选）`，maxLength 改 200
3. 城市列表按首字母分组：用 `<SelectGroup>` + `<SelectLabel>` 实现，只显示有城市的字母组
4. 第二页加 checkbox：`acceptInterview: boolean`（默认 false），Label `愿意接受官方媒体采访（可选）`，提交时传给 API
5. （N5）从 `submitInquiry` 返回值取 `projectSlug`，传给 `<SuccessView projectSlug={result.projectSlug} />`

`success-view.tsx`：
1. Props 加 `projectSlug?: string | null`
2. 有 projectSlug：显示「✅ 你的产品已发布到创业广场」+ 按钮「去广场看看你的产品 →」(`/projects/{projectSlug}`) + 「完善产品详情 →」(`/settings#products`) + 二维码
3. 无 projectSlug：按钮「去广场看看其他创业者 →」（现有）+ 「发布你的产品到广场 →」(`/settings#products`) + 二维码

**验收：**
- [ ] 表单第一页联系方式 Label 显示「手机号」
- [ ] 城市下拉列表按首字母分组显示（A/B/C...）
- [ ] 表单第二页有「愿意接受官方媒体采访」checkbox
- [ ] 提交成功后有 projectSlug 时显示产品引导，无时显示发布引导

---

### Task 2 — 直通车 API 更新（L3 + N5）

**文件：** `app/api/inquiries/route.ts`

**改动：**
1. 接收 `acceptInterview` 字段（boolean，默认 false），写入 Inquiry
2. 创建 Project 时 `description` 字段使用 `productDescription || ''`（不留空）
3. 响应体加 `projectSlug`：查询刚创建的 Project slug 并返回：
   ```typescript
   const project = await prisma.project.findUnique({
     where: { id: projectId },
     select: { slug: true }
   })
   return NextResponse.json({ success: true, projectSlug: project?.slug ?? null })
   ```

**验收：**
- [ ] 提交直通车后 Inquiry 记录有 acceptInterview 字段
- [ ] Project 记录的 description 不为空（使用 productDescription）
- [ ] API 响应包含 projectSlug

---

### Task 3 — 设置页产品描述 Textarea（L4）

**文件：** `components/settings/products-section.tsx`

**改动：**
1. `newProject` state 加 `description: ''` 字段
2. 表单加 Textarea（shadcn/ui Textarea 组件）：
   - placeholder: `介绍你的产品，让更多创业者了解你在做什么（选填，500字以内）`
   - maxLength: 500，rows: 3，`className="resize-none"`
   - 字数计数：`<p className="text-xs text-ash text-right">{newProject.description.length}/500</p>`
3. 提交 API 时携带 description

**验收：**
- [ ] 产品表单有 description Textarea，字数实时显示 X/500
- [ ] 保存后产品记录有 description 数据

---

### Task 4 — 广场产品卡片 description + 发布产品按钮（L5 + N2）

**文件：**
- `components/plaza/plaza-client.tsx`（在 M2 改动基础上继续修改）
- `app/api/plaza/projects/route.ts`（select 加字段）

**改动：**

`app/api/plaza/projects/route.ts`：
1. select 加 `description: true`

`components/plaza/plaza-client.tsx`（ProductCard 组件内）：
1. ProductCard props interface 加 `description?: string | null`
2. ProductCard 内加 `expanded` state（布尔，默认 false）
3. 渲染 description（超 80 字时截断 + 展开/收起按钮）：
   ```tsx
   {description && (
     <div className="text-sm text-mute">
       {expanded || description.length <= 80 ? description : `${description.slice(0, 80)}...`}
       {description.length > 80 && (
         <button onClick={() => setExpanded(!expanded)} className="text-primary text-xs ml-1">
           {expanded ? '收起' : '展开'}
         </button>
       )}
     </div>
   )}
   ```
4. （N2）在广场 Header 区域「发帖」按钮左侧加「发布产品」按钮：
   ```tsx
   <Link href="/settings#products">
     <Button size="lg" variant="outline" className="gap-2 active:scale-[0.98] transition-transform">
       <Package className="h-4 w-4" />
       发布产品
     </Button>
   </Link>
   ```

**验收：**
- [ ] 广场产品卡片显示 description（有数据时）
- [ ] description 超 80 字时有「展开/收起」按钮，点击正常切换
- [ ] 广场 Header 有「发布产品」按钮，点击跳转 `/settings#products`
- [ ] 与 M2 已有改动（TYPE_TABS、latestProgressAt）不冲突

---

### Task 5 — 个人主页产品 description 展示（L6）

**文件：** `components/profile/profile-client.tsx`（以及对应的数据 API）

**改动：**
1. 确认产品数据来源 API（`/api/user/projects` 或 `/api/plaza/projects`），确保 select 包含 description 字段
2. 产品展示区加 description 展示：截断 80 字 + 省略号（不需要展开/收起），样式参考 L5

**验收：**
- [ ] 个人主页产品卡片显示 description（有数据时）
- [ ] 超 80 字时截断显示，不需要展开按钮

---

### Task 6 — 后台意向管理修复（L7）

**文件：**
- `app/admin/inquiries/inquiries-client.tsx`
- `app/api/admin/export/inquiries/route.ts`

**改动：**

`inquiries-client.tsx`：
1. 时间显示改为北京时间：`new Date(createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })`
2. 表格新增「BP文件」列：有 bpFileUrl 时显示「查看BP」链接（`text-primary`），无时显示「—」
3. 表格新增「采访意向」列：acceptInterview 为 true 时显示绿色 Badge「愿意」，否则显示「—」

`export/inquiries/route.ts`：
1. CSV headers 加入 `BP文件` 和 `采访意向`
2. 对应数据行加入 bpFileUrl 和 acceptInterview（acceptInterview 转为「是/否」）

**验收：**
- [ ] 后台意向列表时间显示北京时间格式
- [ ] 表格有「BP文件」列和「采访意向」列
- [ ] CSV 导出包含 BP 文件 URL 和采访意向数据

---

### Task 7 — 注册页社区数量动态读取（N1）

**文件：** `app/(auth)/register/page.tsx`（可能需要新增 `components/auth/register-form.tsx`）

**改动：**
1. 检查当前 page.tsx 是否已是 Server Component
   - 若是 Client Component（有 `'use client'`）：将表单逻辑提取到 `components/auth/register-form.tsx`，page.tsx 改为 async Server Component
   - 若已是 Server Component：直接加 async + prisma 查询
2. 在 Server Component 中查询：`const communityCount = await prisma.community.count({ where: { status: 'ACTIVE' } })`
3. 左侧品牌面板文案改为：`全国 ${communityCount} 个 OPC 社区，真实信息人工核实`（去掉「+」）

**验收：**
- [ ] 注册页左侧面板显示动态社区数量（非硬编码）
- [ ] 数字无「+」后缀

---

### Task 8 — Speed Dial FAB 升级（N4）

**文件：**
- `components/help/help-widget.tsx`（升级为 Speed Dial FAB，或新建 `components/help/speed-dial-fab.tsx`）
- `app/api/public/settings/route.ts`（PUBLIC_KEYS 加 `community_qrcode_url`）
- `app/layout.tsx`（如有替换引用）

**改动：**

`app/api/public/settings/route.ts`：
1. `PUBLIC_KEYS` 加 `'community_qrcode_url'`

`help-widget.tsx`（或新文件）：
1. 主按钮：固定右下角，橙色圆形，图标 `Plus`（展开时旋转 45°），`bg-primary text-white`
2. 展开后向上出现 3 个小按钮（白色背景 + 阴影 + 右侧文字标签）：
   - **发布**（`Package` 图标）：点击后展开2个子选项「发布产品 → /settings#products」和「发布需求 → /plaza/new?type=DEMAND」
   - **加入社群**（`Users` 图标）：弹窗显示二维码（fetch `/api/public/settings?key=community_qrcode_url`）
   - **帮助**（`HelpCircle` 图标）：保持现有逻辑（显示 help_qrcode_url 二维码）
3. 展开/收起用 CSS `transform: translateY` + `opacity` 过渡，不引入 framer-motion
4. 点击遮罩或主按钮收起

**验收：**
- [ ] 右下角显示橙色圆形主按钮
- [ ] 点击展开 3 个小按钮（发布/加入社群/帮助）
- [ ] 「加入社群」弹出微信群二维码
- [ ] 「发布」二级展开有产品和需求两个选项，点击跳转正确
- [ ] 「帮助」保持原有功能
- [ ] 点击遮罩或主按钮可收起

---

### Task 9 — 产品详情页发布进展按钮（N6）

**文件：** `components/projects/project-detail-client.tsx`

**改动：**
1. 先查看 `components/settings/progress-dialog.tsx`，确认 ProgressDialog 的实际 props（`projectId`、`projectName`、`open`、`onOpenChange`、`onSuccess` 或 `onComplete` 等）
2. import ProgressDialog
3. 加 `progressDialogOpen` state（boolean，默认 false）
4. 判断 `isOwner = session?.user?.id === project.userId`
5. 在进展区域（progress section）加按钮（仅 isOwner 时显示）：
   ```tsx
   <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setProgressDialogOpen(true)}>
     <Plus className="h-4 w-4" />
     发布新进展
   </Button>
   ```
6. 渲染 `<ProgressDialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen} projectId={project.id} projectName={project.name} onSuccess/onComplete={() => { setProgressDialogOpen(false); router.refresh() }} />`

**验收：**
- [ ] 本人访问产品详情页时，进展区域有「+ 发布新进展」按钮
- [ ] 非本人访问时，按钮不显示
- [ ] 点击按钮弹出 ProgressDialog，提交后列表刷新

---

### Task 10 — 产品被查看通知（N8）

**文件：**
- `lib/notifications.ts`
- `app/(main)/projects/[slug]/page.tsx`
- `components/notifications/notification-panel.tsx`

**改动：**

`lib/notifications.ts`：
1. 新增 `createProjectViewedNotification(ownerId, visitorName, visitorId, projectSlug, projectName)` 函数
2. 24h 去重：查询 `{ userId: ownerId, type: 'PROJECT_VIEWED', relatedId: projectSlug, content: visitorId, createdAt: { gt: since } }`，存在则 return null
3. 创建通知：`title: \`${visitorName || '有人'}查看了你的产品「${projectName}」\``，`content: visitorId`，`relatedId: projectSlug`

`app/(main)/projects/[slug]/page.tsx`：
1. 在渲染逻辑中，满足「用户已登录 + 非本人」时触发通知（fire-and-forget，`.catch(console.error)`）：
   ```typescript
   if (session?.user?.id && session.user.id !== project.userId) {
     createProjectViewedNotification(project.userId, session.user.name || '', session.user.id, slug, project.name).catch(console.error)
   }
   ```

`components/notifications/notification-panel.tsx`：
1. ICON_MAP 加 `PROJECT_VIEWED: Eye`（from lucide-react）
2. `getNavTarget()` 加 case `'PROJECT_VIEWED'`：返回 `n.relatedId ? \`/projects/${n.relatedId}\` : '/plaza'`

**验收：**
- [ ] 非本人访问产品详情页后，产品 owner 收到 PROJECT_VIEWED 通知
- [ ] 同一访客 24h 内只触发一条通知
- [ ] 通知面板显示 Eye 图标
- [ ] 点击通知跳转到对应产品详情页

---

### Task 11 — Welcome 页快捷入口更新（N9）

**文件：** `app/(auth)/welcome/page.tsx`

**改动：**
1. 找到三个快捷入口的第三项（原「完善主页 → /settings#card」）
2. 改为：`href: '/settings#products'`，`icon: Package`（或 Rocket），`title: '发布你的产品'`，`desc: '让1000+创业者看见你在做什么'`

**验收：**
- [ ] Welcome 页第三个快捷入口显示「发布你的产品」
- [ ] 点击跳转 `/settings#products`
- [ ] 描述文案正确

---

## 执行顺序建议

1. **Task 2**（API 先改，其他功能依赖返回值）
2. **Task 1**（直通车表单 + 成功页，依赖 Task 2 的 projectSlug）
3. **Task 3**（设置页产品 Textarea，独立）
4. **Task 4**（广场 + API，独立，注意不与 M2 冲突）
5. **Task 5**（个人主页，依赖 description 数据）
6. **Task 6**（后台意向，独立）
7. **Task 7**（注册页，独立）
8. **Task 8**（FAB，独立）
9. **Task 9**（产品详情进展按钮，需先查 ProgressDialog props）
10. **Task 10**（N8 通知，独立，需确认 NotificationType 枚举有 PROJECT_VIEWED）
11. **Task 11**（Welcome 页，独立，最简单）

---

## 全局验收

- [ ] `npm run build` 无 TS 错误
- [ ] `components/plaza/plaza-client.tsx` 的改动与 M2 兼容（description + N2 按钮 + latestProgressAt + TYPE_TABS 全部共存）
- [ ] `components/connect/connect-form.tsx` L2 + N5 改动在同一文件中一起完成
- [ ] `app/api/inquiries/route.ts` L3 + N5 改动在同一文件中一起完成
