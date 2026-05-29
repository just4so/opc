# Phase 3 T4: 产品详情页重构（60/40 分栏 + 图片画廊 + Progress 时间线）

## 背景

当前产品详情页是 tab 切换式（介绍/进展/评论三个 tab），需要改为 PRD 第五章定义的 60/40 左右分栏布局。

参考文件：
- `docs/community-upgrade-phase3-prd.md` 第五章"产品详情页"
- `CLAUDE.md` — 项目架构和设计约束
- `components/projects/project-detail-client.tsx` — 当前详情页组件（369行，tab 式）
- `components/projects/project-progress-timeline.tsx` — 进展时间线组件
- `components/projects/project-comment-section.tsx` — 评论区组件
- `app/(main)/projects/[slug]/page.tsx` — Server Component 数据加载

## 设计约束（硬规则）

- 只用 DESIGN.md tokens
- 圆角：cards rounded-2xl, buttons rounded-xl
- hover: shadow-md transition-shadow
- 间距 4px 倍数
- 不引入新 npm 包
- 不新增 Tailwind 自定义颜色

---

## Task 1: 图片画廊组件

创建 `components/projects/image-gallery.tsx`

功能：
- 全宽展示，最多 5 张图片
- 有多张时：左右箭头切换 + 底部圆点指示器
- 单张时：无箭头无指示器
- 无图时：不渲染（由父组件控制）
- 图片 aspect-ratio: 16/9, object-cover, rounded-2xl
- 箭头：半透明白色圆形按钮，hover 不透明度增加
- 移动端支持左右滑动（touch events 或 CSS scroll-snap）

Props：
```ts
interface ImageGalleryProps {
  images: string[]
  alt?: string
}
```

## Task 2: 重写产品详情页布局

重写 `components/projects/project-detail-client.tsx`：

**删除：** tab 切换逻辑（activeTab state、tabs 数组、tab 按钮 UI）

**新布局（桌面端）：**
```
[图片画廊]（全宽，仅 images.length > 0 时显示）
├── 左栏 60% ──────────────────┤── 右栏 40% ──────────┤
│ 产品名                        │ 💬 评论 (count)       │
│ [阶段标签] [❤️ 喜欢 count]    │ ─────────────         │
│                               │ 评论列表（嵌套回复）  │
│ 描述（Markdown 渲染）         │                       │
│                               │ [评论输入框]          │
│ 创建者信息                    │                       │
│ [头像] 名字 [关注]            │                       │
│                               │                       │
│ 🔗 访问网站                   │                       │
│                               │                       │
│ ── 进展记录 ──                │                       │
│ 时间线（复用 timeline 组件）  │                       │
│ [+ 记录进展] (owner only)     │                       │
└───────────────────────────────┴───────────────────────┘
```

**移动端（< lg）：** 单栏上下排列：图片 → 产品信息 → 进展记录 → 评论区

**具体实现：**
- 用 `grid grid-cols-1 lg:grid-cols-5 gap-8`（左 3 右 2 = 60/40）
- 右栏在桌面端 sticky（`lg:sticky lg:top-24 lg:self-start`）
- 评论区右栏有 `id="comments"` 锚点（供卡片 💬 链接跳转）
- ❤️ 喜欢按钮：调用 `/api/projects/[slug]/like`（T3 已创建），乐观更新
- 保留现有 favorite（收藏）功能，但改为次要位置（描述下方小字链接）
- 进展记录直接在左栏底部展示（不再是 tab），复用 ProjectProgressTimeline
- "记录进展"按钮 → Dialog 弹窗（内容 textarea + 可选里程碑 input）

## Task 3: 进展记录 Dialog

创建进展记录表单 Dialog（可以内联在 detail-client 里或独立组件）：

- 触发：owner 看到的"+ 记录进展"按钮
- 表单字段：
  - 内容（textarea，必填，placeholder "分享你的最新进展..."）
  - 里程碑（input，可选，placeholder "例如：第一个付费用户"）
- 提交 API：POST `/api/projects/[slug]/progress`（需要创建）
- 成功后：关闭 Dialog，新进展插入时间线顶部（乐观更新）

## Task 4: 进展记录 API

创建 `app/api/projects/[slug]/progress/route.ts`：

- POST：创建 Progress 记录
  - 认证必须
  - 验证当前用户是 project owner
  - body: `{ content: string, milestone?: string }`
  - 创建 Progress（content, milestone, projectId, authorId）
  - 返回新创建的 progress 对象

- GET：获取项目进展列表（分页）
  - 公开访问
  - query: `?page=1&limit=20`
  - 返回 Progress 列表 + pagination

## Task 5: Server Component 数据调整

修改 `app/(main)/projects/[slug]/page.tsx`：

- 查询时加入 `images` 字段（Project.images）
- 查询时加入 `likeCount` 字段
- 查询 Progress 模型（替代当前的 posts where type=PROGRESS）
- 传入 `initialLikeCount` 和 `initialIsLiked`（查 Favorite 表 projectId）
- serializedProject 加入 images, likeCount

## Task 6: 进展时间线组件适配

修改 `components/projects/project-progress-timeline.tsx`：

- 数据源从 Post（type=PROGRESS）改为 Progress 模型
- 接口调整：props 改为接收 Progress[] 而非 ProgressPost[]
- 保持时间线 UI 不变（圆点 + 连线 + 日期 + 内容 + 里程碑标记）
- owner 的"⋯"菜单：编辑/删除进展

---

## 验收标准

- [ ] `npm run build` 通过
- [ ] 桌面端 60/40 分栏布局正确
- [ ] 移动端单栏上下排列
- [ ] 图片画廊左右切换正常
- [ ] ❤️ 喜欢可操作（乐观更新）
- [ ] 评论区在右栏展示
- [ ] 进展记录在左栏底部展示
- [ ] Owner 可通过 Dialog 添加新进展
- [ ] 无 tab 切换（已删除）
