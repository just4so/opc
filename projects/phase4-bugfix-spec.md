# Phase 4 Bug Fix & Polish Spec

> 基于本地测试反馈，修复 Phase 4 发布后发现的问题。

## 修复范围（7项）

---

### Fix 1: 发帖重复提交 — plaza/new/page.tsx
**已有 loading 保护**，但检查 `setLoading(true)` 是否在 `router.push` 之前被 reset。
**实际问题**：发帖后跳转慢（服务端 revalidate 导致），用户多次点击。
**修复**：提交成功后立即 `setLoading(false)` 改为**保持 loading 直到 router.push 完成不 reset**（即成功路径不调用 setLoading(false)，只在 catch 里 reset）。这样按钮在跳转完成前一直 disabled。

```
文件：app/(main)/plaza/new/page.tsx
找到 handleSubmit 函数中成功路径的 setLoading(false)，删除它（只保留 catch 里的那个）
```

---

### Fix 2: 产品保存后「记录进展」按钮变灰 — components/settings/products-section.tsx
**根因**：`handleUpdate` 成功后调用 `setEditingProject(null)`，此时 `proj.slug` 从 editingProject 取，变为 null，导致进展按钮 `disabled={!proj.slug}`。

实际上 `projects` state 里的数据有 slug，问题出在渲染时用了更新前的 ref。

**修复**：
1. `handleCreate` 和 `handleUpdate` 添加 `saving` 状态防重复提交
2. 进展按钮 disabled 条件改为从 `projects` state（非 editingProject）取 slug

```typescript
// 在组件顶部添加
const [saving, setSaving] = useState(false)

// handleCreate：
const handleCreate = async () => {
  if (!newProject.name.trim() || saving) return
  setSaving(true)
  try {
    // ... 原有逻辑不变
  } catch {}
  setSaving(false)
}

// handleUpdate：
const handleUpdate = async () => {
  if (!editingProject || !editingProject.name.trim() || saving) return
  setSaving(true)
  try {
    // ... 原有逻辑不变
  } catch {}
  setSaving(false)
}

// ProjectForm 组件的 Button，添加 saving 到 disabled：
// 现在：disabled={!project.name.trim()}
// 改为：disabled={!project.name.trim() || saving}
// （需要把 saving prop 传入 ProjectForm）
```

**注意**：进展按钮 `disabled={!proj.slug}` 逻辑本身是对的（项目需要有 slug 才能发进展），问题是更新成功后 `setProjects` 已经更新了列表，`proj.slug` 应该有值。检查 API 返回的数据是否包含 slug 字段——如果 PUT `/api/user/projects/[id]` 返回的对象有 slug，则 `setProjects(prev => prev.map(p => p.id === data.id ? data : p))` 后 slug 应该存在。读一下 API 返回字段，如果缺 slug 就在 select 里加上。

---

### Fix 3: 产品卡片高度不齐 — components/plaza/product-card.tsx
**修复**：description 区域改为固定 2 行（`line-clamp-2`），超出显示「展开」。展开后显示全文 + 「收起」。

```typescript
// 找到 description 渲染块（约第 150-165 行）：
// 现在是：超过 80 字截断 + 展开按钮
// 改为：line-clamp-2 截断 + 展开按钮

{project.description && (
  <div className="text-sm text-mute leading-relaxed">
    <span className={expanded ? '' : 'line-clamp-2'}>
      {project.description}
    </span>
    {/* 展开按钮仅在收起状态且有溢出时显示 */}
    {/* 用 ref+scrollHeight 判断是否溢出，或简化为 description 长度 > 50 就显示展开 */}
    {project.description.length > 50 && (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded) }}
        className="text-primary text-xs ml-1"
      >
        {expanded ? '收起' : '展开'}
      </button>
    )}
  </div>
)}
```

**同时**：卡片内容区加 `min-h` 保证底部按钮对齐。在 `<div className="p-4 flex flex-col flex-1">` 内，description 区域后加一个 `flex-1` 的空白撑高块，使 like/comment 按钮始终在底部：

```typescript
<div className="p-4 flex flex-col flex-1">
  {/* 标题 + 阶段 */}
  {/* description */}
  <div className="flex-1" /> {/* 撑高，使底部按钮固定在底 */}
  {/* owner 信息 */}
  {/* like/comment/progress badge */}
</div>
```

---

### Fix 4: 产品时间标签用创建时间兜底 — components/plaza/plaza-client.tsx + product-card.tsx

**修复**：`latestProgressAt` 改为：有进展用进展时间，无进展用产品创建时间。

```typescript
// plaza-client.tsx，找到传递 latestProgressAt 的地方（约第 729 行）：
// 现在：latestProgressAt={proj.progress?.[0]?.createdAt ?? null}
// 改为：latestProgressAt={proj.progress?.[0]?.createdAt ?? proj.createdAt}
```

**同时**：product-card.tsx 中文案改为区分两种情况：
- 有进展：`今天有进展` / `X天前有进展`  
- 无进展（用创建时间）：`今天发布` / `X天前发布`

```typescript
// product-card.tsx 中接受新 prop：
// hasProgress?: boolean  （由 plaza-client 传入：hasProgress={!!proj.progress?.[0]}）

// badge 文案逻辑：
const verb = hasProgress
  ? (daysSinceProgress === 0 ? '今天有进展' : `${daysSinceProgress}天前有进展`)
  : (daysSinceProgress === 0 ? '今天发布' : `${daysSinceProgress}天前发布`)
```

`lib/queries/plaza.ts` 的 `getPlazaProjects` 已经有 `createdAt` 字段（Project 默认包含），确认 select 里有 `createdAt`，如果没有要加上。

---

### Fix 5: 广场「发布产品」按钮间距 — components/plaza/plaza-client.tsx

找到 header 区域「发布产品」和「发帖」两个按钮，在它们之间加 `gap-3` 或者外层 flex 容器加 `gap-3`。

```typescript
// 找到 "发布产品" 按钮附近的 flex 容器
// 确保 className 里有 gap-3（现在可能是 gap-2 或 gap-1）
// 改为 gap-3
```

---

### Fix 6: FAB 改为 4 个平级选项 + 文字可点击 — components/help/help-widget.tsx

**改动**：
1. 删除「发布」二级菜单结构（`showPublish` state 和相关 JSX）
2. 改为 4 个平级选项：发布产品 / 发布需求 / 加入社群 / 帮助
3. 每个选项的 label 文字和图标按钮**包在同一个 `<Link>` 或 `<button>` 里**，整行可点击
4. 主按钮图标改用 `Sparkles`（或 `Zap`）替代 `Plus`，更有活力感

```typescript
// 新的 FAB 选项结构（4个平级）：
const FAB_ITEMS = [
  { label: '帮助', icon: HelpCircle, action: 'qr:help' },
  { label: '加入社群', icon: Users, action: 'qr:community' },
  { label: '发布需求', icon: FileQuestion, href: '/plaza/new?type=DEMAND' },
  { label: '发布产品', icon: Boxes, href: '/settings#products' },
]

// 每个选项渲染为整行可点击（Link 或 button 包住 label+icon）：
// href 类型用 <Link href={...} className="flex items-center gap-2 ...">
//   <span className="label">...</span>
//   <div className="icon-circle">...</div>
// </Link>

// qr 类型用 <button onClick={...} className="flex items-center gap-2 w-full">
//   <span className="label">...</span>
//   <div className="icon-circle">...</div>
// </button>

// 删除 showPublish state 和相关逻辑
// 主按钮图标：import { Sparkles } from 'lucide-react'，替换 Plus
```

---

### Fix 7: Description placeholder 文案 — components/settings/products-section.tsx

找到 description Textarea 的 `placeholder` 属性，改为：

```
placeholder="介绍你的产品：它解决什么问题、目标用户是谁、现在处于什么阶段……让其他创业者快速了解你在做的事"
```

---

## 执行顺序

1. 以上 7 个修复打包为一个 ACP 任务
2. `npm run build` 验证
3. 一次性 commit: `fix(phase4): post submission dedup, product card polish, FAB flatten`

## 验收点

- [ ] 发帖页快速连击「发布」→ 只发一条
- [ ] 产品详情页编辑产品保存后 → 进展按钮**不变灰**
- [ ] 广场产品卡片 description 2行截断，可展开
- [ ] 无进展的产品显示「X天前发布」时间标签
- [ ] 「发布产品」和「发帖」按钮有明显间距
- [ ] FAB 展开4个平级选项，点文字/图标都能跳转
- [ ] products-section.tsx description placeholder 文案更新
