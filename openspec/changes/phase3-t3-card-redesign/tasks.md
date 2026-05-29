# Phase 3 T3: 卡片重设计（小红书风格，单一快捷操作）

## 背景

当前广场三个 tab（创业者/产品/动态）的卡片需要从"信息堆砌+多按钮"改为"视觉吸引+单一快捷操作"。

参考文件：
- `docs/community-upgrade-phase3-prd.md` 第四章"卡片设计规范"
- `CLAUDE.md` — 项目架构和设计约束
- `components/plaza/plaza-client.tsx` — 当前广场主组件（1054行）
- `components/plaza/recommended-creator-card.tsx` — 当前创业者卡片

## 设计约束（硬规则）

- 只用 DESIGN.md tokens：primary #F97316, text ink/body/mute/ash, surfaces canvas/soft/card/dark
- 圆角：cards rounded-2xl, buttons rounded-xl
- hover: shadow-md transition-shadow
- 间距 4px 倍数
- 不引入新 npm 包
- 不新增 Tailwind 自定义颜色

---

## Task 1: 产品卡片组件

创建 `components/plaza/product-card.tsx`

**双模式（根据 images 数组是否为空自动切换）：**

有图版：
- 封面图占卡片上部 ~40% 高度（aspect-[16/10] object-cover）
- 下方：产品名 + 阶段标签（右对齐）
- 描述摘要（两行截断，line-clamp-2）
- 创建者行：小头像(24px) + 名字 + 城市（"· 城市"内联）+ 网站链接右对齐（外链图标+域名，stopPropagation）
- 分割线
- 底部：❤️ 数量（可点击）+ 💬 数量（链接到详情页 #comments）

无图版（更紧凑）：
- 无封面区域
- 产品名 + 阶段标签
- 描述摘要（三行截断，line-clamp-3）
- 创建者行同上
- 分割线 + ❤️ + 💬

**交互：**
- 卡片整体点击 → `/projects/[slug]`（用 Link 或 router.push）
- ❤️ 按钮：stopPropagation，乐观更新（toggle liked 状态 + count ±1），调用 `/api/posts/${id}/like`（注意：这个 API 现在内部用 Favorite，但路径不变）。等等——产品的喜欢 API 是什么？检查 `app/api/` 下有没有 project like 路由。如果没有，需要创建 `app/api/projects/[slug]/like/route.ts`（用 Favorite 表，projectId）。
- 未登录点 ❤️ → redirect 到 /login
- 创建者名字点击 → `/profile/[username]`（stopPropagation）
- 网站链接 → window.open（stopPropagation）

**Props：**
```ts
interface ProductCardProps {
  project: {
    id: string
    slug: string
    name: string
    description: string
    images: string[]
    stage: string
    website?: string | null
    likeCount: number
    commentCount: number
    owner: { id: string; name: string; username: string; image?: string | null; city?: string | null }
  }
  isLiked?: boolean
  onLikeChange?: (projectId: string, liked: boolean) => void
}
```

**阶段标签颜色映射：**
- IDEA → bg-surface-card text-mute
- BUILDING → bg-blue-50 text-blue-600
- LAUNCHED → bg-green-50 text-green-600
- REVENUE → bg-orange-50 text-orange-600
- PROFITABLE → bg-emerald-50 text-emerald-700

## Task 2: 人物卡片组件

创建 `components/plaza/person-card.tsx`

布局：
- 头像(48px) + 名字 + ✓认证标记（如果有）
- 赛道标签 · 城市
- 简介（一行截断 line-clamp-1）
- 📦 产品名（点击跳产品详情，仅展示第一个产品）
- 粉丝数 · 产品数
- 右下角 [+关注] 按钮（唯一快捷操作）

**交互：**
- 卡片整体（除关注按钮和产品名外）点击 → `/profile/[username]`
- 产品名点击 → `/projects/[slug]`（stopPropagation）
- 关注按钮：stopPropagation，调用 follow API，乐观更新
- 未登录点关注 → redirect /login

**Props：**
```ts
interface PersonCardProps {
  user: {
    id: string
    name: string
    username: string
    image?: string | null
    city?: string | null
    mainTrack?: string | null
    bio?: string | null
    showInPlaza?: boolean
    followerCount: number
    projectCount: number
    projects?: { slug: string; name: string }[]
    isVerified?: boolean
  }
  isFollowing?: boolean
  onFollowChange?: (userId: string, following: boolean) => void
}
```

**删除：** "查看主页"按钮、"联系TA"按钮

## Task 3: 帖子卡片微调

修改 `components/plaza/post-card.tsx`（或在 plaza-client.tsx 内的帖子渲染逻辑）：
- 底部加 ❤️ 可操作（乐观更新）+ 💬 评论数（展示，点击跳帖子详情）
- **删除：** PROGRESS 类型的橙色左边框和 🎯 标签

## Task 4: 产品喜欢 API

检查是否已有 `/api/projects/[slug]/like` 路由。如果没有，创建：

`app/api/projects/[slug]/like/route.ts`：
- POST：toggle Favorite（userId + projectId）
- 同时更新 Project.likeCount（increment/decrement）
- 返回 `{ liked: boolean, likeCount: number }`
- 认证必须

参考 `app/api/posts/[id]/like/route.ts` 的 Favorite 实现模式。

## Task 5: 集成到广场

修改 `components/plaza/plaza-client.tsx`：
- 产品 tab：用新的 ProductCard 组件替换当前渲染逻辑
- 创业者 tab：用新的 PersonCard 组件替换当前渲染逻辑
- 帖子 tab：应用 Task 3 的微调
- 传入 isLiked/isFollowing 状态（从现有的 likedMap/followStatusMap）
- 传入 onLikeChange/onFollowChange 回调更新状态

## Task 6: 产品喜欢状态批量查询

确认广场加载产品列表时，能获取当前用户对每个产品的 liked 状态。

检查 `app/(main)/plaza/page.tsx` 的数据加载逻辑：
- 如果已有 likedMap 包含 projectId → 直接用
- 如果只有 postId 的 liked 状态 → 需要加一个 API 或在 page.tsx 查询时加入 project favorites

可能需要新增 `/api/user/liked-projects/route.ts`（返回当前用户 favorite 的 projectId 列表），或在 plaza page.tsx 的 server component 里直接查。

---

## 验收标准

- [ ] `npm run build` 通过
- [ ] 产品卡片有图/无图两种模式正确渲染
- [ ] ❤️ 按钮可操作（乐观更新 + API 调用）
- [ ] 人物卡片关注按钮可操作
- [ ] PROGRESS 帖子不再有橙色边框和 🎯 标签
- [ ] 卡片点击跳转正确（整体跳详情，局部操作 stopPropagation）
