# OPC创业圈 - 一人公司创业社区平台

连接全国OPC社区与AI创业者，提供政策信息、资源对接、创业交流的一站式平台。

## 项目简介

OPC创业圈是一个面向AI时代"一人公司"（One Person Company）创业者的在线社区平台。平台汇集全国各地OPC创业社区资源，为创业者提供：

- 🗺️ **社区地图** - 可视化展示全国38+个OPC社区分布
- 📋 **入驻指南** - 各社区入驻政策、申请流程、配套服务详情
- 💬 **创业广场** - 创业者日常交流、经验分享、问题求助
- 🚀 **项目展示** - 展示创业项目，获取反馈，寻找早期用户

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
- **部署**: Vercel

## 本地开发

### 环境要求

- Node.js 18+
- pnpm / npm / yarn
- PostgreSQL 数据库

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/opc-community.git
cd opc-community

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接、百度地图API Key等配置

# 4. 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 5. 导入社区数据
npm run import:communities

# 6. 启动开发服务器
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
opc-community/
├── prisma/                  # Prisma 数据库模型
├── scripts/                 # 数据导入脚本
│   ├── import-communities.ts   # 社区数据导入
│   └── update-coordinates.ts   # 坐标更新脚本
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── (main)/          # 主布局页面
│   │   │   ├── communities/ # 社区地图
│   │   │   ├── plaza/       # 创业广场
│   │   │   ├── projects/    # 项目展示
│   │   │   ├── profile/     # 个人中心
│   │   │   └── settings/    # 设置页面
│   │   └── api/             # API 路由
│   ├── components/          # React 组件
│   │   ├── communities/     # 社区相关组件
│   │   ├── layout/          # 布局组件
│   │   ├── providers/       # Context Providers
│   │   └── ui/              # shadcn/ui 组件
│   ├── constants/           # 常量配置
│   └── lib/                 # 工具函数
└── 城市目录/                # 社区 Markdown 数据源
    ├── 深圳/
    ├── 杭州/
    ├── 北京/
    └── ...
```

## 数据管理

### 添加新社区

1. 在对应城市目录下创建 Markdown 文件（如 `深圳/新社区名称.md`）
2. 按照模板格式填写社区信息
3. 运行导入脚本：`npm run import:communities`

### 更新社区坐标

```bash
npm run update:coordinates
```

### Markdown 模板

```markdown
# 社区名称

## 基本信息

| 项目 | 内容 |
|------|------|
| 所在城市 | xx市xx区 |
| 详细地址 | 完整地址 |
| 运营方 | 运营主体名称 |
| 揭牌时间 | 202X年X月 |

## 社区简介

社区介绍文字...

## 入驻政策

### 空间补贴
...

### 算力补贴
...

## 入驻流程

1. 步骤一
2. 步骤二

## 配套服务

- 服务一
- 服务二

## 适合人群

- 人群一
- 人群二

## 参考链接

- [链接标题](URL)

---
*更新时间：2026年X月*
```

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

### 项目展示

- 发布项目
- 项目详情
- 寻求反馈

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
