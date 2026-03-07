# OPC创业圈 - 一人公司创业社区平台

连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台。

## 项目简介

OPC创业圈是一个面向AI时代"一人公司"（One Person Company）创业者的在线社区平台。平台汇集全国各地OPC创业社区资源，为创业者提供：

- 🗺️ **社区地图** - 可视化展示全国38+个OPC社区分布
- 📋 **入驻指南** - 各社区入驻政策、申请流程、配套服务详情
- 💬 **创业广场** - 创业者日常交流、经验分享、问题求助
- 🤝 **合作广场** - 发布需求订单、寻找合作伙伴
- 🤖 **模型广场** - 稳定低价的国内外AI模型中转服务
- 📰 **创业资讯** - 政策动态、融资新闻、行业活动
- 🔍 **全站搜索** - 搜索动态、订单、社区、用户
- 💬 **私信系统** - 用户间私信沟通
- 🛡️ **管理后台** - 社区/用户/内容管理（支持 ADMIN/MODERATOR 角色）

## 数据统计

| 指标 | 数量 |
|------|------|
| 覆盖城市 | 16+ |
| OPC社区 | 38+ |
| 热门城市 | 深圳、杭州、北京、上海、苏州、常州、无锡、成都 |

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: TailwindCSS + shadcn/ui
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **认证**: NextAuth.js
- **地图**: 百度地图 WebGL API
- **部署**: Netlify

## 本地开发

### 环境要求

- Node.js 18+
- pnpm / npm / yarn
- PostgreSQL 数据库

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/just4so/opc.git
cd opc

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接、百度地图API Key等配置

# 4. 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看项目。

### 环境变量

```env
# 数据库
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# 百度地图
NEXT_PUBLIC_BMAP_KEY="your-baidu-map-key"
```

## 项目结构

```
opc/
├── prisma/                  # Prisma 数据库模型
├── scripts/                 # 自动化脚本
│   └── fetch-news.ts        # 资讯抓取脚本
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── (main)/          # 主布局页面
│   │   │   ├── communities/ # 社区地图
│   │   │   ├── plaza/       # 创业广场
│   │   │   ├── market/      # 合作广场
│   │   │   ├── models/      # 模型广场
│   │   │   ├── messages/    # 私信系统
│   │   │   ├── search/      # 搜索页面
│   │   │   ├── profile/     # 个人中心
│   │   │   └── settings/    # 设置页面
│   │   ├── admin/           # 管理后台
│   │   │   ├── users/       # 用户管理
│   │   │   ├── posts/       # 动态管理
│   │   │   ├── orders/      # 订单管理
│   │   │   ├── communities/ # 社区管理
│   │   │   └── news/        # 资讯管理
│   │   └── api/             # API 路由
│   ├── components/          # React 组件
│   │   ├── admin/           # 管理后台组件
│   │   ├── communities/     # 社区相关组件
│   │   ├── layout/          # 布局组件
│   │   ├── providers/       # Context Providers
│   │   └── ui/              # shadcn/ui 组件
│   ├── constants/           # 常量配置
│   └── lib/                 # 工具函数
```

## 数据管理

### 社区管理

通过管理后台管理社区数据：

1. 使用 ADMIN 账号登录
2. 进入 `/admin/communities`
3. 支持新建、编辑、删除社区
4. 支持地图选点获取坐标

## 主要功能

### 社区地图

- 百度地图可视化展示全国OPC社区分布
- 支持城市筛选
- 点击标记查看社区简介，跳转详情页

### 社区详情

- 完整的社区信息展示
- 入驻政策、申请流程
- 配套服务、适合人群
- 位置地图

### 用户系统

- 注册/登录
- 个人中心
- 资料设置

### 创业广场

- 发布动态
- 点赞/评论
- 话题标签

### 合作广场

- 发布需求订单
- 发布合作需求
- 联系方式弹窗

### 模型广场

- 展示国内外 AI 模型中转服务
- 支持按类型筛选（文本/图像/语音/Embedding）
- 点击模型卡片显示详情和联系方式

### 私信系统

- 用户公开主页发起私信
- 实时对话列表
- 未读消息提醒

### 全站搜索

- 搜索动态、订单、社区、用户
- 分类筛选结果

### 管理后台

- 仪表盘数据统计
- 用户管理（ADMIN）
- 动态/订单管理（ADMIN + MODERATOR）
- 社区完整 CRUD（ADMIN）
- 资讯管理（ADMIN）

## 贡献指南

欢迎提交 Pull Request 或 Issue！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 许可证

MIT License

---

**OPC创业圈** - 让每一个AI创业者都能找到属于自己的创业社区 🚀
