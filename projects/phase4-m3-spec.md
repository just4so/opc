# Phase 4 M3: 其余功能（L1-L7 + N1/N2/N4-N9）

> Milestone: M3
> 状态: 待执行（M1+M2 完成后执行）
> PRD 章节参考: 一·L1-L7、二·N1/N2/N4-N9

---

## 任务目标

完成所有剩余功能点，包括直通车优化（L系列）、注册页动态数据（N1）、广场「发布产品」按钮（N2）、Speed Dial FAB（N4）、直通车成功页引导（N5）、产品详情发布进展（N6）、产品被查看通知（N8）、Welcome页快捷入口（N9）。

---

## 涉及文件清单

### L 系列（直通车 + 后台）
1. `prisma/schema.prisma` — L1: Inquiry.acceptInterview（M1 已完成，跳过）
2. `components/connect/connect-form.tsx` — L2
3. `app/api/inquiries/route.ts` — L3
4. `components/settings/products-section.tsx` — L4
5. `components/plaza/plaza-client.tsx` — L5（产品卡片加 description，与 M2 的 ProductCard 改动在同一文件，注意合并）
6. `components/profile/profile-client.tsx` — L6（产品加 description 展示）
7. `app/admin/inquiries/inquiries-client.tsx` — L7
8. `app/api/admin/export/inquiries/route.ts` — L7

### N 系列
9. `app/(auth)/register/page.tsx` — N1
10. `components/plaza/plaza-client.tsx` — N2（同文件，与 L5 + M2 合并）
11. `app/layout.tsx` — N4（替换 HelpWidget）
12. `components/help/help-widget.tsx` — N4（升级为 Speed Dial FAB，或新建 speed-dial-fab.tsx）
13. `components/connect/connect-form.tsx` — N5（传 projectSlug 给 SuccessView，与 L2 同文件合并）
14. `components/connect/success-view.tsx` — N5
15. `app/api/inquiries/route.ts` — N5（返回 projectSlug，与 L3 同文件合并）
16. `components/projects/project-detail-client.tsx` — N6
17. `lib/notifications.ts` — N8
18. `app/(main)/projects/[slug]/page.tsx` — N8（触发通知）
19. `components/notifications/notification-panel.tsx` — N8（图标+跳转）
20. `app/api/public/settings/route.ts` — N4（白名单加 community_qrcode_url）
21. `app/(auth)/welcome/page.tsx` — N9

---

## 逐功能改动说明

### L2：直通车表单优化（`components/connect/connect-form.tsx`）

1. **微信号 → 手机号**
   - Label: `微信号` → `手机号`
   - placeholder: `请输入微信号` → `请输入手机号`
   - 字段名 `wechat` 如果和后端映射，保持 wechat 字段不变，只改 UI 文案（或查清楚字段名，改为 phone）

2. **productTagline → 产品描述**
   - Label: `产品一句话介绍` → `产品简介`
   - placeholder: 改为 `用一两句话描述你在做什么（可选）`
   - maxLength: 改为 200（原 tagline 较短，产品描述稍长）

3. **城市列表按首字母分组**
   - 将城市列表按首字母（拼音）分组
   - 使用 `<SelectGroup>` + `<SelectLabel>` 实现分组展示
   - 分组标签：A / B / C ... Z（只显示有城市的字母组）

4. **第二页加「愿意接受官方媒体采访」checkbox**
   - 在第二页（产品信息页）适当位置加 checkbox
   - Label: `愿意接受官方媒体采访（可选）`
   - state: `acceptInterview: boolean`，默认 false
   - 提交时传给 API

### L3：直通车 API（`app/api/inquiries/route.ts`）

1. 接收 `acceptInterview` 字段（boolean，默认 false）
2. 写入 `Inquiry` 时加 `acceptInterview`
3. 创建 Project 时，`description` 用 `productDescription`（不留空）：
   ```typescript
   description: productDescription || '',
   ```
4. **N5 联动**：API 响应改为同时返回 `projectSlug`：
   ```typescript
   // 查询刚创建的 Project slug
   const project = await prisma.project.findUnique({
     where: { id: projectId },
     select: { slug: true }
   })
   return NextResponse.json({ 
     success: true,
     projectSlug: project?.slug ?? null
   })
   ```

### L4：设置页产品描述（`components/settings/products-section.tsx`）

1. `newProject` state 加 `description: ''` 字段
2. 表单加 Textarea：
   ```tsx
   <Textarea
     placeholder="介绍你的产品，让更多创业者了解你在做什么（选填，500字以内）"
     value={newProject.description}
     onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
     maxLength={500}
     rows={3}
     className="resize-none"
   />
   <p className="text-xs text-ash text-right">{newProject.description.length}/500</p>
   ```
3. 提交 API 时带上 description

### L5：广场产品卡片加 description（`components/plaza/plaza-client.tsx`）

注意：此文件在 M2 中已经修改过（TYPE_TABS + ProductCard latestProgressAt），M3 需要在 M2 基础上继续加：

1. ProductCard props interface 加 `description?: string | null`
2. `app/api/plaza/projects/route.ts` select 加 `description: true`
3. 卡片内 description 展示（超 80 字可展开）：
   ```tsx
   {description && (
     <div className="text-sm text-mute">
       {expanded || description.length <= 80 
         ? description 
         : `${description.slice(0, 80)}...`}
       {description.length > 80 && (
         <button 
           onClick={() => setExpanded(!expanded)}
           className="text-primary text-xs ml-1"
         >
           {expanded ? '收起' : '展开'}
         </button>
       )}
     </div>
   )}
   ```
4. 加 `expanded` state（每个卡片独立，在 ProductCard 组件内）

### L6：个人主页产品加 description（`components/profile/profile-client.tsx`）

1. 对应 API（`/api/user/projects` 或 `/api/plaza/projects`）select 加 description
2. 产品展示区加 description 字段展示（样式参考 L5，但不需要展开/收起，直接截断 80 字加省略号）

### L7：后台意向管理修复

**`app/admin/inquiries/inquiries-client.tsx`：**

1. **北京时间显示**：找到时间显示的地方，改为：
   ```typescript
   new Date(createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
   ```

2. **BP文件列**：表格新增「BP文件」列：
   ```tsx
   <TableCell>
     {inquiry.bpFileUrl 
       ? <a href={inquiry.bpFileUrl} target="_blank" className="text-primary text-sm hover:underline">查看BP</a>
       : <span className="text-ash text-sm">—</span>
     }
   </TableCell>
   ```

3. **采访意向列**：表格新增「采访意向」列：
   ```tsx
   <TableCell>
     {inquiry.acceptInterview 
       ? <Badge className="bg-green-100 text-green-700">愿意</Badge>
       : <span className="text-ash text-sm">—</span>
     }
   </TableCell>
   ```

**`app/api/admin/export/inquiries/route.ts`：**

CSV 导出 header 加入 `BP文件,采访意向`，对应数据行加入 `bpFileUrl,acceptInterview`。

---

### N1：注册页社区数量动态读取（`app/(auth)/register/page.tsx`）

**关键：register page 目前可能是 client component（因为有表单），需要拆分。**

实现方案：
1. 创建新的外层 Server Component `app/(auth)/register/page.tsx`（改为 async）
2. 原有表单逻辑移到 `components/auth/register-form.tsx`（Client Component）
3. 在 Server Component 里：
   ```typescript
   const communityCount = await prisma.community.count({ where: { status: 'ACTIVE' } })
   return <RegisterLayout communityCount={communityCount}><RegisterForm /></RegisterLayout>
   ```
4. 左侧品牌面板文案改为：`全国 ${communityCount} 个 OPC 社区，真实信息人工核实`（去掉「+」）

> 如果当前 page.tsx 已经是 Server Component，直接加 async + prisma 查询即可，无需拆分。

### N2：广场 Header 加「发布产品」按钮（`components/plaza/plaza-client.tsx`）

注意：此文件 M2/L5 已修改，在已有 PageHeader 区域补充：

在「发帖」按钮左侧加：
```tsx
<Link href="/settings#products">
  <Button size="lg" variant="outline" className="gap-2 active:scale-[0.98] transition-transform">
    <Package className="h-4 w-4" />
    发布产品
  </Button>
</Link>
```

### N4：Speed Dial FAB（升级 `components/help/help-widget.tsx`）

将现有 HelpWidget 升级为可展开 Speed Dial FAB。

**组件结构：**
```
固定在右下角的主按钮（橙色圆形）
  ├── 展开后向上出现3个小按钮：
  │   ├── [📦 发布] → 点击后展开2个子选项
  │   │   ├── 发布产品 → /settings#products
  │   │   └── 发布需求 → /plaza/new?type=DEMAND
  │   ├── [👥 加入社群] → 弹窗显示二维码（读 community_qrcode_url）
  │   └── [❓ 帮助] → 现有逻辑（显示 help_qrcode_url 二维码）
  └── 点击遮罩或再次点击主按钮收起
```

**实现要点：**
- 展开/收起用 CSS `transform: translateY` + `opacity` 过渡，不引入 framer-motion
- 「加入社群」二维码：`fetch('/api/public/settings?key=community_qrcode_url')`
- 主按钮图标：`Plus`（展开时旋转 45° 变 `×`）或 `Zap`
- 主按钮样式：`bg-primary text-white`（橙色实心），区别于原来的白色 HelpWidget
- 小按钮：白色背景 + 阴影 + 右侧文字标签
- 「发布」子选项：点击「发布」小按钮后，在其左侧再展开2个更小的选项
- `app/api/public/settings/route.ts` PUBLIC_KEYS 需同步加 `community_qrcode_url`（见单独改动）

### N5：直通车成功页引导优化

**`components/connect/connect-form.tsx`：**
- 从 `submitInquiry` 的返回值里拿 `projectSlug`
- 传给 SuccessView：`<SuccessView qrcodeUrl={qrcodeUrl} projectSlug={result.projectSlug} />`

**`components/connect/success-view.tsx`：**
- Props 加 `projectSlug?: string | null`
- 有 projectSlug 时展示：
  ```
  ✅ 你的产品已发布到创业广场
  [去广场看看你的产品 →]  href="/projects/{projectSlug}"
  [完善产品详情 →]         href="/settings#products"
  [添加客服，获取审核结果]  （现有二维码）
  ```
- 无 projectSlug 时展示：
  ```
  [去广场看看其他创业者 →]  （现有）
  [发布你的产品到广场 →]    href="/settings#products"（替换「完善卡片」）
  [添加客服，获取审核结果]  （现有二维码）
  ```

### N6：产品详情页加「+ 发布进展」按钮（`components/projects/project-detail-client.tsx`）

1. import `ProgressDialog`（来自 `components/settings/progress-dialog.tsx`）
2. 判断是否是本人（`session.user.id === project.userId`）
3. 在进展区域底部（本人视角）加按钮：
   ```tsx
   {isOwner && (
     <Button 
       variant="outline" 
       size="sm" 
       className="gap-1.5"
       onClick={() => setProgressDialogOpen(true)}
     >
       <Plus className="h-4 w-4" />
       发布新进展
     </Button>
   )}
   <ProgressDialog
     open={progressDialogOpen}
     onOpenChange={setProgressDialogOpen}
     projectId={project.id}
     projectName={project.name}
     onSuccess={() => {
       setProgressDialogOpen(false)
       router.refresh()
     }}
   />
   ```
4. 需检查 ProgressDialog 的实际 props（`onSuccess` 可能叫 `onComplete` 或类似名称，以实际代码为准）

### N8：产品被查看通知

**`lib/notifications.ts`：**

新增函数：
```typescript
export async function createProjectViewedNotification(
  ownerId: string,
  visitorName: string,
  visitorId: string,
  projectSlug: string,  // 存 slug，通知面板直接拼 URL
  projectName: string
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: ownerId,
      type: 'PROJECT_VIEWED',
      relatedId: projectSlug,  // 存 slug
      content: visitorId,
      createdAt: { gt: since },
    },
  })
  if (existing) return null

  return createNotification({
    userId: ownerId,
    type: 'PROJECT_VIEWED',
    title: `${visitorName || '有人'}查看了你的产品「${projectName}」`,
    content: visitorId,
    relatedId: projectSlug,  // 存 slug，通知面板直接拼 URL
  })
}
```

**`app/(main)/projects/[slug]/page.tsx`：**

在 Server Component 渲染逻辑里，当满足以下条件时触发通知：
- 用户已登录（`session?.user?.id` 存在）
- 非本人（`session.user.id !== project.userId`）

```typescript
if (session?.user?.id && session.user.id !== project.userId) {
  // 不 await，不阻塞渲染
  createProjectViewedNotification(
    project.userId,
    session.user.name || session.user.username || '',
    session.user.id,
    slug,  // URL 参数，即 projectSlug
    project.name
  ).catch(console.error)
}
```

**`components/notifications/notification-panel.tsx`：**

1. ICON_MAP 加：
   ```typescript
   PROJECT_VIEWED: Eye,
   ```
2. `getNavTarget()` 加 case：
   ```typescript
   case 'PROJECT_VIEWED':
     return n.relatedId ? `/projects/${n.relatedId}` : '/plaza'
   ```

**`app/api/public/settings/route.ts`：**
```typescript
const PUBLIC_KEYS = ['help_qrcode_url', 'community_qrcode_url']
```

### N9：Welcome 页第三个快捷入口（`app/(auth)/welcome/page.tsx`）

找到三个快捷入口区域的第三个：
```tsx
// 改前
{ href: '/settings#card', icon: Zap, title: '完善主页', desc: '让创业者认识你' }

// 改后
{ href: '/settings#products', icon: Rocket, title: '发布你的产品', desc: '让1000+创业者看见你在做什么' }
```

> 如果 Rocket 图标视觉不合适，可以用 Package 图标。

---

## 验收标准

### 直通车
- [ ] 联系方式 Label 改为「手机号」
- [ ] 城市列表按首字母分组展示
- [ ] 第二页有「愿意接受官方媒体采访」checkbox
- [ ] 成功页有产品时显示「产品已发布」引导，无产品时显示「去发布产品」引导

### 产品功能
- [ ] 产品详情页本人视角有「+ 发布进展」按钮，弹框正常工作
- [ ] Settings 产品表单有 description Textarea（500字限制）
- [ ] 广场产品卡片 description 超80字可展开/收起
- [ ] 个人主页产品有 description 展示

### FAB
- [ ] 右下角 FAB 点击展开3个选项
- [ ] 「加入社群」显示微信群二维码
- [ ] 「发布」展开后有产品/需求两个选项
- [ ] 帮助功能保持原有

### 后台
- [ ] 意向列表时间显示北京时间
- [ ] 表格有 BP文件列、采访意向列
- [ ] CSV 导出包含 BP 和采访意向数据

### 注册 & Welcome
- [ ] 注册页社区数量为 DB 实时数字
- [ ] Welcome 页第三个快捷入口为「发布你的产品」

### 通知
- [ ] 非本人访问产品详情页，owner 收到 PROJECT_VIEWED 通知
- [ ] 通知面板正确显示 Eye 图标 + 正确跳转

### 全局
- [ ] `npm run build` 无报错
- [ ] `components/plaza/plaza-client.tsx` 的改动没有与 M2 冲突（description + latestProgressAt + TYPE_TABS + N2 按钮全部在同一文件内）

---

## ⚠️ 注意事项

1. `components/plaza/plaza-client.tsx` 在 M2 已改动，M3 需要在 M2 结果基础上继续加（description 展示 + N2 按钮）
2. `components/connect/connect-form.tsx` 的 L2 和 N5 改动在同一文件，一起做
3. `app/api/inquiries/route.ts` 的 L3 和 N5 改动在同一文件，一起做
4. N8 通知触发用 `.catch(console.error)` 不阻塞页面渲染，通知失败不影响用户体验
5. ProgressDialog 的实际 props 以 `components/settings/progress-dialog.tsx` 中的定义为准，不要猜测
