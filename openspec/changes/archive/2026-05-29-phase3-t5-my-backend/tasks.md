# Phase 3 T5: "我的"后台重构

## 背景

当前 `/settings` 页面（926行）有三个 section：basic/card/projects。需要重构为 PRD 定义的"我的"后台，三个分类：我的主页/我的产品/账号与安全。同时废弃旧 `/profile` 页面（580行），改为 redirect。

参考文件：
- `docs/community-upgrade-phase3-prd.md` 第 3.2 节"我的后台"
- `CLAUDE.md` — 项目架构和设计约束
- `app/(main)/settings/page.tsx` — 当前设置页（926行，要重构）
- `app/(main)/profile/page.tsx` — 旧个人中心（580行，要废弃改 redirect）
- `components/layout/user-nav.tsx` — 用户下拉菜单
- `components/layout/mobile-menu.tsx` — 移动端菜单

## 设计约束（硬规则）

- 只用 DESIGN.md tokens
- 不引入新 npm 包
- 不新增 Tailwind 自定义颜色

---

## Task 1: 废弃旧 /profile 页面

将 `app/(main)/profile/page.tsx` 改为 redirect：

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.username) redirect('/login')
  redirect(`/profile/${session.user.username}`)
}
```

从 580 行变成 ~8 行。

## Task 2: 重构 /settings 为"我的"后台

重写 `app/(main)/settings/page.tsx`，三个分类：

**左侧导航（hash-based）：**
- 我的主页 `#profile`
- 我的产品 `#products`
- 账号与安全 `#account`

**顶部：** "预览我的公开主页 →" 链接（跳 `/profile/[username]`）

### "我的主页" (#profile)

- 个人资料编辑区：头像/名字/简介/城市/赛道/阶段
- 折叠"更多信息"：skills/canOffer/lookingFor（如果 schema 有这些字段）
- 下方 tab 切换：
  - 我的动态（用户发的帖子列表）
  - 我的喜欢（产品 sub-tab + 帖子 sub-tab，从 Favorite 查）
  - 我的关注（关注的人列表）
  - 我的粉丝（粉丝列表）

### "我的产品" (#products)

每个产品卡片展示：产品名 + 阶段标签 + 描述摘要 + 喜欢数/评论数

操作按钮：
- "编辑" → 展开内联编辑表单（名称/描述/阶段/网站/图片，复用 ImageUpload 组件）
- "查看" → 新窗口打开 `/projects/[slug]`
- "记录进展" → 弹出 Dialog（复用 T4 的进展 Dialog 逻辑）
- "删除" → 二次确认后删除

### "账号与安全" (#account)

- 邮箱验证状态 + 发送验证邮件
- 密码修改
- 邮件通知开关（emailNotifications toggle）

## Task 3: 导航菜单调整

修改 `components/layout/user-nav.tsx`：
- 删除"个人中心"菜单项（指向 /profile 的那个）
- 保留"我的"（指向 /settings）
- 如果没有"我的"，把"设置"改名为"我的"

修改 `components/layout/mobile-menu.tsx`：
- 同样删除"个人中心"
- 保留"我的"指向 /settings

## Task 4: 删除旧 settings 中"创业者卡片"模块

当前 settings 有 `card` section（创业者卡片预览/编辑）。这个功能合并到"我的主页"的资料编辑区。确保重构后不再有独立的"卡片"section。

## Task 5: 公开主页 isOwnProfile 编辑入口

检查 `app/(main)/profile/[username]/page.tsx`：
- 如果当前用户查看自己的主页（isOwnProfile），显示一个"编辑资料"按钮跳 `/settings#profile`
- 如果已有此功能则保持不变

---

## 验收标准

- [ ] `npm run build` 通过
- [ ] `/profile` redirect 到 `/profile/[username]`
- [ ] `/settings` 有三个分类可切换（hash-based）
- [ ] "我的主页"有资料编辑 + 四个 sub-tab
- [ ] "我的产品"有编辑/查看/记录进展/删除四个操作
- [ ] "账号与安全"有邮箱验证+密码+通知开关
- [ ] 导航菜单无"个人中心"，只有"我的"
- [ ] 顶部有"预览公开主页"链接
