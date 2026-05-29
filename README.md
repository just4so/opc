# OPC圈 — 一人公司创业者社区平台

连接全国 OPC（One Person Company）创业者，聚合政策信息、展示产品、促进协作。

🌐 线上地址：[opcquan.com](https://opcquan.com)

---

## 功能全景

### 核心功能

| 模块 | 说明 |
|------|------|
| 创业者广场 | 三视图（产品·创业者·动态），筛选排序，通知横条 |
| 产品展示 | 产品详情页（60/40 分栏），图片画廊，进展时间线 |
| 社区直通车 | 两步表单提交意向，自动创建广场卡片 |
| 社区地图 | 370+ 社区，70+ 城市，省份分组，搜索筛选 |
| 关注体系 | 关注创业者，动态推送，粉丝列表 |
| 通知系统 | 铃铛通知，卡片查看/联系/状态变更触发 |
| OPC 雷达 | AI 驱动的 OPC 行业日报，自动采集+编辑 |
| 资讯中心 | 政策资讯 + 专项政策区块，原创/外链 |
| 认证体系 | 后台审核，Badge 展示，认证用户置顶 |

### 前台路由

| 路由 | 功能 |
|------|------|
| `/` | 首页：Hero + 热门产品横滑 + 最新入驻创业者 + 数据统计 |
| `/communities` | 社区列表：省份分组 + 推荐置顶 + 搜索 |
| `/communities/[slug]` | 社区详情：三层权限（基本/登录/解锁） |
| `/connect` / `/connect/[slug]` | 社区直通车：两步表单 |
| `/plaza` | 创业者广场：产品·创业者·动态三 Tab |
| `/projects/[slug]` | 产品详情：图片画廊 + 进展时间线 + 评论 |
| `/plaza/[id]` | 帖子详情：Markdown 渲染 + 评论 |
| `/news` | 资讯列表 + 专项政策 |
| `/radar/[issueNo]` | OPC 雷达日报 |
| `/profile/[username]` | 用户主页：产品 + 关注/粉丝 |
| `/settings` | 「我的」后台：主页·产品·账号安全 |
| `/search` | 全站搜索 |

### 管理后台（`/admin`）

| 路由 | 功能 |
|------|------|
| `/admin` | Dashboard：统计 + 趋势图 + 快捷入口 |
| `/admin/users` | 用户管理：角色/认证/导出 |
| `/admin/posts` | 动态管理：精华/隐藏/删除 |
| `/admin/news` | 资讯管理 + 原创编辑器 |
| `/admin/communities` | 社区管理 + 认领审核 |
| `/admin/orders` | 合作广场管理 |
| `/admin/verify` | 认证审核 |
| `/admin/radar` | 雷达日报管理 |
| `/admin/policies` | 政策管理 |
| `/admin/settings` | 系统设置（二维码等） |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14（App Router） |
| 样式 | TailwindCSS + shadcn/ui + @tailwindcss/typography |
| 数据库 | PostgreSQL（Supabase，pgBouncer 6543 端口） |
| ORM | Prisma 5 |
| 认证 | NextAuth.js v5 beta（JWT + Credentials） |
| 存储 | Cloudflare R2（产品图片、BP 文件） |
| 邮件 | Nodemailer（QQ 企业邮箱 SMTP） |
| 地图 | 百度地图 WebGL API |
| Markdown | react-markdown + remark-gfm |
| 部署 | EdgeOne Pages |

---

## 本地开发

### 环境要求

- Node.js 18+
- PostgreSQL（或 Supabase 连接）

### 快速启动

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 初始化数据库
npm run db:push
npm run db:generate

# 导入种子数据（可选）
npm run db:seed           # 社区基础数据
npm run db:seed-plaza     # 广场示例数据

# 启动
npm run dev
```

访问 http://localhost:3000

### 常用命令

```bash
npm run dev           # 开发服务器
npm run build         # 生产构建
npm run lint          # ESLint

npm run db:push       # 推送 schema 到数据库
npm run db:generate   # 重新生成 Prisma client
npm run db:seed       # 社区种子数据
npm run db:seed-plaza # 广场种子数据
npm run db:cleanup    # 清理重复数据
npm run db:verify     # 验证数据完整性

npm run fetch:news    # RSS 资讯抓取
```

---

## 项目结构

```
opc/
├── app/
│   ├── (auth)/            # 登录/注册
│   ├── (main)/            # 前台页面（共享 header/footer）
│   ├── admin/             # 管理后台
│   └── api/               # API 路由
├── components/
│   ├── plaza/             # 广场组件（卡片、筛选、通知横条）
│   ├── projects/          # 产品详情组件（画廊、进展时间线）
│   ├── follow/            # 关注按钮
│   ├── settings/          # 「我的」后台组件
│   ├── connect/           # 直通车表单
│   ├── communities/       # 社区相关
│   ├── notifications/     # 通知铃铛/面板
│   ├── layout/            # Header/Footer
│   └── ui/                # shadcn/ui 基础组件
├── lib/
│   ├── auth.ts            # NextAuth 配置
│   ├── db.ts              # Prisma 单例
│   ├── admin.ts           # 权限工具
│   ├── mailer.ts          # 邮件发送
│   ├── r2.ts              # R2 存储
│   ├── notifications.ts   # 通知创建
│   ├── slug.ts            # Slug 生成（pinyin）
│   └── radar/             # OPC 雷达逻辑
├── prisma/
│   └── schema.prisma      # 数据模型
├── scripts/               # 种子数据、迁移脚本
├── constants/             # 常量定义
├── types/                 # TypeScript 类型
├── docs/                  # PRD、设计文档
├── openspec/              # OpenSpec 变更归档
└── DESIGN.md              # 设计系统 token 定义
```

> ⚠️ 本项目**没有 `src/` 目录**，所有代码直接在项目根目录下。

---

## 核心数据模型

| 模型 | 说明 |
|------|------|
| User | 创业者，含 mainTrack/startupStage/verified/showInPlaza |
| Community | OPC 社区，含 entryFriendly(1-5)/amenities/realTips |
| Project | 产品，含 images[]/stage/slug/likeCount/commentCount |
| Progress | 产品进展记录，含 content/milestone/images[] |
| Post | 广场帖子，type: DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION |
| Follow | 关注关系（followerId → followingId） |
| Favorite | 统一点赞（userId+postId 或 userId+projectId） |
| Comment | 评论（支持嵌套回复，关联 Post 或 Project） |
| Notification | 通知（CARD_VIEWED/CONTACTED/INQUIRY_STATUS/NEW_FOLLOWER 等） |
| Inquiry | 直通车意向 |
| News | 资讯（原创/外链） |
| Policy | 专项政策（省/市/区三级） |
| RadarIssue/RadarItem | OPC 雷达日报 |

---

## 渲染策略

| 页面 | 策略 | revalidate |
|------|------|------------|
| 首页 | ISR | 600s |
| 社区列表 | ISR | 300s |
| 社区详情 | ISR + generateStaticParams | 60s |
| 广场 | ISR | 60s |
| 产品详情 | ISR + generateStaticParams | 300s |
| 资讯 | ISR | 300s |
| 雷达 | ISR | 300s |
| 管理后台 | force-dynamic | — |

---

## 权限体系

| 角色 | 权限 |
|------|------|
| USER | 发帖/评论/关注/点赞/提交意向 |
| MODERATOR | + 管理动态/合作广场 |
| ADMIN | + 全部后台功能 |

---

## 设计系统

定义在 `DESIGN.md` + `tailwind.config.ts`：

- **Primary:** #F97316（OPC 橙）
- **文字层级:** ink #000 / body #33332e / mute #62625b / ash #91918c
- **表面:** canvas #fff / surface-soft #fbfbf9 / surface-card #f6f6f3
- **圆角:** cards rounded-2xl / buttons rounded-xl / modals rounded-[32px]
- **交互:** hover:shadow-md + 卡片 hover:-translate-y-1 + 按钮 active:scale-95

---

## 许可证

MIT License
