# Phase 3 T7: 首页热门产品 + Bug 修复 + 废弃代码清理

## 背景

Phase 3 最后一个任务。PRD 第七、八、九章。

**务必先读 `CLAUDE.md` 了解设计约束和项目架构。**

---

## Task 1: 首页"热门产品"横版滚动

文件: `app/(main)/page.tsx`

当前"最新动态"区块（第 211-263 行）改为"热门产品"横版滚动：

### 数据查询
替换 `latestPosts` 查询为热门产品查询：
```ts
const hotProducts = await prisma.project.findMany({
  where: { status: 'PUBLISHED', owner: { showInPlaza: true } },
  orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
  take: 10,
  select: {
    id: true, slug: true, name: true, description: true,
    images: true, logo: true, likeCount: true, stage: true,
    owner: { select: { name: true, username: true } }
  }
})
```
注意：当所有 likeCount=0 时，fallback 到 createdAt 排序（上面的 orderBy 已处理）。

### UI
- 区域标题："热门产品"，右侧 "查看全部 →" 链接到 `/plaza?tab=products`
- 横版滚动容器：`overflow-x-auto flex gap-4 pb-4 snap-x snap-mandatory`
- 隐藏滚动条：`scrollbar-hide`（加 CSS `[&::-webkit-scrollbar]{display:none}` 或 tailwind plugin）
- 每张卡片：`min-w-[280px] max-w-[280px] snap-start`
- 卡片内容：
  - 顶部：封面图（images[0]）或渐变色块（`bg-gradient-to-br from-surface-card to-surface-soft`）+ 产品首字母
  - 中间：产品名 + 描述（2行截断）
  - 底部：❤️ 数 + 创始人名
- 整张卡片可点击，链接到 `/projects/${slug}`
- 移动端可左右滑动

### 空状态
无产品时显示："还没有产品，去直通车发布你的第一个产品吧" + 按钮跳 `/connect`

---

## Task 2: 首页统计数字更新

文件: `app/(main)/page.tsx`

找到 "创业者" 统计数字（约第 198-201 行），把硬编码的数字改为 "5,000+"。
如果当前是动态查询的，保持不变。如果是硬编码，改为 "5,000+"。

---

## Task 3: Bug 修复

### 3.1 产品 slug 中文 404
文件: `app/(main)/projects/[slug]/page.tsx`（或 `lib/` 中的 getProject 函数）
修复: 在查询前对 `params.slug` 做 `decodeURIComponent()`

### 3.2 关注按钮状态回滚
文件: 找到 FollowButton 组件（可能在 `components/plaza/person-card.tsx` 或 `components/ui/follow-button.tsx`）
修复: 确保 `onFollowChange` 回调能更新父组件的 `followStatusMap`。如果 plaza-client.tsx 里有 followStatusMap state，确保 PersonCard 的 follow 操作能回调更新它。

### 3.3 进展 tab 空状态链接
文件: 产品详情页的进展区域（`components/projects/project-detail-client.tsx` 或 `components/projects/project-progress-timeline.tsx`）
修复: 空状态的"记录进展"链接改为触发 Dialog（不跳转到发帖页）

---

## Task 4: 废弃代码清理

检查并删除以下（如果还存在的话）：

- [ ] `components/plaza/milestone-badge.tsx` 的引用（PostCard 中）
- [ ] PostCard 中 PROGRESS 类型的橙色左边框特殊样式
- [ ] `components/plaza/progress-timeline.tsx`（如果存在且已被 project-progress-timeline 替代）
- [ ] 产品/人物卡片中的"查看详情"/"联系创始人"/"查看主页"/"联系TA"按钮（T3 应该已删，确认）
- [ ] settings 中"创业者卡片"独立模块（T5 应该已合并，确认）
- [ ] 导航菜单中"个人中心"入口（T5 应该已改，确认）
- [ ] Like 模型的直接使用（应该全部走 Favorite 了，确认无遗漏）

**注意：** 不要删除 `prisma/schema.prisma` 中的 Like model 定义（保留到数据完全迁移确认后再删）。只清理应用层代码中的直接引用。

---

## 设计约束（硬规则）

- 只用现有 Tailwind tokens
- 不引入新 npm 包
- 不新增 Tailwind 自定义颜色或 inline style
- Import Prisma from `@/lib/db`
- 间距 4px 倍数，cards rounded-2xl

## 验收标准

- `npm run build` 通过
- 首页有"热门产品"横版滚动区
- 产品 slug 中文不再 404
- 无 TypeScript 类型错误
