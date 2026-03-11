# OPC圈 — 一人公司创业者社区平台

全国 OPC（One Person Company）政策信息聚合平台，连接创业者与各地 OPC 社区。

🌐 线上地址：[opcquan.com](https://opcquan.com)

---

## 功能全景

### 前台

| 路由 | 功能 |
|------|------|
| `/` | 首页，社区数量统计 + 资讯预览 + 实时动态条 |
| `/start` | 用户引导页，5类创业者画像，帮助用户找到适合自己的社区 |
| `/communities` | 社区地图，城市筛选 + 入驻难度排行 + 百度地图标注 |
| `/communities/[slug]` | 社区详情，入驻政策 + 真实入驻说明 + 用户评价 |
| `/plaza` | 创业广场，发帖/评论/点赞，双视图（列表/卡片），话题筛选，排序 |
| `/plaza/[id]` | 帖子详情，Markdown 渲染，评论区 |
| `/market` | 合作广场，发布需求/合作，联系方式弹窗 |
| `/market/[slug]` | 合作详情页 |
| `/news` | 资讯列表，原创专区置顶，分类筛选 |
| `/news/[id]` | 资讯详情，Markdown 渲染（原创）/ 外链跳转 |
| `/tools` | 工具导航，60+ AI工具，6分类，国内可用标注 |
| `/search` | 全站搜索，覆盖动态/订单/社区/用户 |
| `/profile/[username]` | 用户主页，发起私信入口 |
| `/messages` | 私信系统 |
| `/settings` | 用户设置 |

### 管理后台（`/admin`，需 ADMIN 角色）

| 路由 | 功能 |
|------|------|
| `/admin` | 仪表盘：5项统计 + 近7日趋势折线图（注册/发帖）+ 快捷入口 |
| `/admin/users` | 用户管理：搜索、角色筛选、改角色、导出 CSV |
| `/admin/users/[id]` | 用户详情：基本信息 + 最近20条动态 |
| `/admin/posts` | 动态管理：搜索、话题筛选、状态筛选、内容预览展开、设为精华、隐藏/显示、删除 |
| `/admin/news` | 资讯管理：搜索、切换原创标记、编辑作者、删除 |
| `/admin/news/new` | 新建原创资讯（标题/分类/作者/正文/发布时间） |
| `/admin/orders` | 合作广场管理：搜索、状态筛选、置顶、隐藏、导出 |
| `/admin/communities` | 社区管理：列表含难度星级列 |
| `/admin/communities/new` | 新建社区 |
| `/admin/communities/[id]/edit` | 编辑社区，含入驻难度星级点击器（1-5星） |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14（App Router） |
| 样式 | TailwindCSS + shadcn/ui + @tailwindcss/typography |
| 数据库 | PostgreSQL（Supabase） |
| ORM | Prisma 5 |
| 认证 | NextAuth.js v5 beta（JWT + Credentials） |
| 地图 | 百度地图 WebGL API |
| Markdown | react-markdown + remark-gfm |
| 部署 | Netlify（待迁移） |

---

## 本地开发

### 环境要求

- Node.js 18+
- PostgreSQL 数据库（或 Supabase 连接）

### 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入以下变量（见下方说明）

# 3. 初始化数据库
npm run db:push       # 同步 schema
npm run db:generate   # 生成 Prisma client

# 4. 导入种子数据（可选）
npm run db:seed           # 社区基础数据
npm run db:seed-plaza     # 创业广场示例数据（用户/帖子/评论）

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 环境变量

```env
# 数据库（Supabase）
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."      # 用于 Prisma 迁移

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# 百度地图（社区地图功能）
NEXT_PUBLIC_BMAP_KEY="your-baidu-map-key"
```

### 常用命令

```bash
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npm run lint          # ESLint 检查

npm run db:push       # 推送 schema 变更到数据库
npm run db:generate   # 重新生成 Prisma client
npm run db:seed       # 导入社区种子数据
npm run db:seed-plaza # 导入广场种子数据（用户/帖子/评论）
npm run db:cleanup    # 清理重复社区数据
npm run db:verify     # 验证社区数据完整性

npm run fetch:news    # 从 RSS 源抓取最新资讯
```

---

## 项目结构

```
opc/
├── prisma/
│   └── schema.prisma          # 数据模型
├── scripts/
│   ├── fetch-news.ts          # 资讯 RSS 抓取
│   ├── seed-plaza.ts          # 广场种子数据
│   └── seed-communities.ts    # 社区种子数据
├── src/
│   ├── app/
│   │   ├── (auth)/            # 登录/注册页
│   │   ├── (main)/            # 前台页面（含 header/footer）
│   │   │   ├── page.tsx       # 首页（SSR + revalidate=60）
│   │   │   ├── communities/   # 社区地图
│   │   │   ├── plaza/         # 创业广场
│   │   │   ├── market/        # 合作广场
│   │   │   ├── news/          # 资讯
│   │   │   ├── tools/         # 工具导航
│   │   │   ├── start/         # 用户引导
│   │   │   ├── search/        # 全站搜索
│   │   │   ├── profile/       # 用户主页
│   │   │   └── messages/      # 私信
│   │   ├── admin/             # 管理后台
│   │   │   ├── page.tsx       # 仪表盘
│   │   │   ├── users/         # 用户管理（含 [id] 详情）
│   │   │   ├── posts/         # 动态管理
│   │   │   ├── news/          # 资讯管理（含 new）
│   │   │   ├── orders/        # 合作广场管理
│   │   │   └── communities/   # 社区管理（含 new / [id]/edit）
│   │   └── api/               # API 路由
│   ├── components/
│   │   ├── admin/             # 管理后台组件（TrendChart 等）
│   │   ├── communities/       # 社区相关组件
│   │   ├── home/              # 首页组件（ActivityBar）
│   │   ├── layout/            # Header / Footer
│   │   ├── plaza/             # 广场组件（PostCard、PlazaClient）
│   │   ├── news/              # 资讯组件（NewsClient）
│   │   ├── providers/         # Context Providers
│   │   └── ui/                # shadcn/ui 基础组件
│   ├── constants/             # 话题标签、分类常量
│   └── lib/
│       ├── auth.ts            # NextAuth 配置
│       ├── admin.ts           # requireStaff / requireAdmin
│       └── db.ts              # Prisma 单例
```

---

## 数据模型（核心）

| 模型 | 说明 |
|------|------|
| `User` | 用户，含 `mainTrack`（赛道）、`startupStage`（阶段）、`role`（USER/MODERATOR/ADMIN） |
| `Community` | OPC社区，含 `applyDifficulty`（入驻难度1-5）、`realTips`（真实说明）、`lastVerifiedAt` |
| `CommunityReview` | 用户对社区的评价，每人限评一次，含 `difficulty` 星级投票 |
| `Post` | 创业广场帖子，`type`：DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION，含 `topics`（话题标签数组）、`pinned`（精华） |
| `Project` | 合作广场条目，`contentType`：DEMAND/COOPERATION |
| `News` | 资讯，`isOriginal` 区分原创/外链，含 `content`（Markdown正文） |
| `Conversation/Message` | 私信系统 |

---

## 渲染策略

| 页面 | 策略 | 说明 |
|------|------|------|
| 首页 | SSR + `revalidate=60` | 静态预渲染，60秒 ISR |
| 资讯列表 | SSR + `revalidate=300` | 5分钟缓存 |
| 社区地图 | SSR + `revalidate=300` | 初始数据 SSR，交互 CSR |
| 创业广场 | SSR + `force-dynamic` | 初始数据 SSR，实时更新 |
| 管理后台 | `force-dynamic` | 全部实时 |

> 核心页面采用"SSR 初始数据 + Client Component 交互"模式：首屏内容由服务端直出（无白屏），筛选/分页等交互在客户端完成。

---

## 权限体系

- `USER`：普通用户，可发帖/评论/私信
- `MODERATOR`：版主，可管理动态和合作广场
- `ADMIN`：管理员，可访问全部后台功能

鉴权方式：
- 前台：`useSession()` 检查登录态
- API：`auth()` from `@/lib/auth`
- 管理后台 API：`requireStaff()` / `requireAdmin()` from `@/lib/admin`

---

## 开发说明

### 新增管理后台功能

```bash
# 1. 新建 API 路由
src/app/api/admin/your-feature/route.ts
# 在路由开头调用 requireStaff() 或 requireAdmin()

# 2. 新建后台页面
src/app/admin/your-feature/page.tsx
# layout.tsx 已做角色验证，页面本身无需重复鉴权
```

### 修改数据库 Schema

```bash
# 1. 编辑 prisma/schema.prisma
# 2. 推送变更
npm run db:push
# 3. 更新 Prisma client
npm run db:generate
```

### Markdown 渲染

帖子详情页（`/plaza/[id]`）和资讯详情页（`/news/[id]`）均使用 `react-markdown + remark-gfm` 渲染 Markdown，并配合 `@tailwindcss/typography` 的 `prose` 类做样式。

广场帖子卡片预览会自动剥离 Markdown 符号，显示纯文本摘要。

---

## 主题配置

定义在 `tailwind.config.ts`：

| 变量 | 颜色 | 用途 |
|------|------|------|
| `primary` | #F97316（橙色） | 主操作按钮、强调色 |
| `secondary` | #334155（深灰） | 标题、正文 |
| `accent` | #10B981（翠绿） | 辅助强调 |

---

## 测试

### 单元测试（Vitest）

```bash
npm test           # 运行所有单元测试（一次性）
npm run test:watch # 监听模式（开发时用）
npm run test:ui    # 可视化 UI 界面
```

覆盖范围：输入校验、业务逻辑（点赞切换/评价去重/分类映射等）、API 参数验证。

### E2E 测试（Playwright）

```bash
# 先确保 dev server 在运行
npm run dev

# 另开终端
npm run e2e          # 运行所有 E2E 测试
npm run e2e:ui       # 交互式 UI 模式
npm run e2e:report   # 查看上次报告
```

覆盖范围：公开页面加载、导航、未登录权限跳转、管理后台访问控制。

### CI（GitHub Actions）

每次 push 到 `main`/`develop` 分支自动运行：
1. TypeScript 类型检查 (`tsc --noEmit`)
2. Prisma schema 验证
3. 单元测试 (`npm test`)

E2E 测试需要真实服务，暂不在 CI 中运行（需配置测试数据库和服务启动）。

---

## 许可证

MIT License
