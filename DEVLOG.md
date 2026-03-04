# 开发日志

## 2026-03-04

### UI 与文案优化

根据网站定位（AI创业者社区平台）进行全站 UI 优化：

**配色方案**
- 主色：温暖橙 (#F97316) - 低饱和高质感
- 辅助色1：深蓝灰 (#334155) - 专业沉稳
- 辅助色2：薄荷绿 (#10B981) - 清新点缀

**视觉升级**
- 玻璃态导航栏（半透明 + 模糊）
- 柔和阴影（shadow-soft）
- 卡片悬浮效果（轻微上移）
- 渐变背景和渐变文字

**首页文案优化**
- Hero：「让 AI 创业者不再孤独前行」
- 特性卡片：更具描述性的副标题
- CTA：「开启你的创业之旅」

**修改文件**
- `tailwind.config.ts` - 新配色、阴影、圆角
- `src/app/globals.css` - 玻璃态、渐变、卡片动效
- `src/app/(main)/layout.tsx` - 玻璃态导航栏
- `src/app/(main)/page.tsx` - 首页重新设计
- `src/components/ui/card.tsx` - 圆角和阴影更新
- `src/components/ui/button.tsx` - 圆角更新

---

### 搜索页 Suspense 边界修复

修复 Netlify 构建错误：`useSearchParams() should be wrapped in a suspense boundary`

**问题原因**
- Next.js 14 静态生成时，`useSearchParams()` 需要 Suspense 边界
- 否则会导致构建失败

**解决方案**
- 将使用 `useSearchParams()` 的逻辑提取到 `SearchContent` 组件
- 使用 `<Suspense fallback={<SearchFallback />}>` 包裹
- 添加加载状态 UI

**修改文件**
- `src/app/(main)/search/page.tsx` - 添加 Suspense 边界

---

### 模型广场

新增模型广场板块，展示国内外 AI 模型中转服务：

**功能特性**
- 展示 18 个热门 AI 模型（GPT-4o、Claude、DeepSeek、Qwen 等）
- 支持按类型筛选（文本生成、图像生成、语音、Embedding）
- 热门模型优先展示（火焰标记）
- 点击卡片弹窗显示详情和邮件联系方式

**新增文件**
- `src/app/(main)/models/page.tsx` - 模型广场页面
- `src/app/(main)/models/layout.tsx` - 页面元数据
- `src/components/models/model-card.tsx` - 模型卡片组件
- `src/constants/models.ts` - 模型数据常量

**修改文件**
- `src/app/(main)/layout.tsx` - 导航栏添加"模型广场"入口
- `src/app/sitemap.ts` - 站点地图添加 /models

---

### 私信功能完善

修复用户公开主页"发送私信"按钮的多个问题：

**问题修复**
- Prisma 客户端 undefined 错误 - 重新生成客户端
- API 响应解析错误 - `fetchConversation` 正确提取 `data.conversation`
- 发送消息后响应处理 - `handleSend` 正确提取 `data.message`
- 日期格式错误 - 添加安全检查防止 Invalid Date

**修改文件**
- `src/app/(main)/messages/[id]/page.tsx` - 对话详情页修复
- `src/app/(main)/messages/page.tsx` - 私信列表页日期处理
- `src/app/(main)/profile/[username]/page.tsx` - 添加错误状态显示
- `src/app/api/conversations/route.ts` - 添加详细错误信息返回

---

### 用户主页链接完善

为系统各处的用户头像和用户名添加跳转到公开主页的链接：

**修改文件**
- `src/components/plaza/post-interactions.tsx` - 评论区评论者头像和用户名
- `src/app/(main)/search/page.tsx` - 搜索结果中的动态作者和用户卡片
- `src/components/plaza/post-card.tsx` - 帖子卡片作者头像
- `src/app/(main)/plaza/[id]/page.tsx` - 帖子详情页作者头像（主内容和侧边栏）
- `src/app/(main)/market/[slug]/page.tsx` - 订单详情页发布者头像

---

### 管理后台搜索与分页功能

为社区管理和订单管理添加搜索与分页功能：

**社区管理**
- 支持按名称、地址、运营方搜索
- 支持按城市筛选
- 支持按状态筛选（运营中/待审核/已停用）
- 分页显示（每页20条）

**订单管理**
- 支持按标题、描述搜索
- 支持按类型筛选（需求订单/合作需求）
- 支持按状态筛选（已发布/已隐藏/草稿/已归档）
- 分页显示（每页20条）

**修改文件**
- `src/app/api/admin/communities/route.ts` - 添加 page/search/city/status 参数
- `src/app/admin/communities/communities-client.tsx` - 添加搜索/筛选/分页 UI
- `src/app/api/admin/orders/route.ts` - 添加 page/search/status/contentType 参数
- `src/app/admin/orders/page.tsx` - 添加搜索/筛选/分页 UI

---

### 首页统计数据动态化

将首页和社区地图的统计数据改为从数据库实时获取：

**新增文件**
- `src/app/api/stats/route.ts` - 统计数据 API，返回社区总数、城市总数、各城市社区数量

**修改文件**
- `src/app/(main)/page.tsx` - 首页调用 API 显示动态的"覆盖城市"和"OPC社区"数量
- `src/app/(main)/communities/page.tsx` - 服务端获取城市统计并传递给组件
- `src/components/communities/communities-client.tsx` - 接收 cityCounts prop
- `src/components/communities/city-selector.tsx` - 使用动态数据显示各城市社区数量

**数据来源**
- 使用 Prisma `groupBy` 按城市聚合 ACTIVE 状态的社区数量
- 首页通过客户端 fetch 获取统计数据
- 社区列表页通过服务端渲染获取并传递给客户端组件

---

### 社区数据清理与完善

根据《信息汇总_国内各城市OPC社区调研.xlsx》完成社区数据的系统性清理和补全：

**清理重复数据**
- 删除 6 组完全重复的社区（同名同城）
- 合并 4 组相似名称的社区（如"临港零界魔方"→"零界魔方OPC社区"）

**补全缺失社区**
- 从 Excel 导入 63 个新社区
- 更新 33 个现有社区的完整信息
- 新增城市：扬州(18)、玉林、连云港、马鞍山

**最终数据**
- 社区总数：122 个
- 覆盖城市：29 个
- 重复记录：0

**新增/更新文件**
- `scripts/cleanup-communities.ts` - 重复数据清理脚本
- `scripts/seed-communities.ts` - 重写为从 Excel 导入
- `scripts/analyze-data.ts` - 数据分析验证脚本
- `package.json` - 添加 `db:cleanup` 和 `db:verify` 脚本
- `src/constants/cities.ts` - 更新城市列表和社区数量

---

### 补充社区数据：从调研报告导入

根据《国内OPC社区调研报告》补充社区数据：

**导入结果**
- 新增 37 个社区
- 更新 2 个已存在社区
- 社区总数从 38 个增至 75 个

**新增城市覆盖**
- 济南、合肥、东莞、南宁、扬州、宿迁、石家庄、哈密、南通

**新增文件**
- `scripts/seed-communities.ts` - 社区数据补充脚本

**更新文件**
- `package.json` - `db:seed` 脚本指向新位置

**去重机制**
- 使用 Prisma `upsert` 以 `slug` 为唯一键
- 已存在则更新，不存在则新增

---

### 精简冗余功能：废弃社区导入脚本

完成社区管理后台 CRUD 后，废弃原有的 Markdown 导入机制：

**删除文件**
- `scripts/import-communities.ts` - 社区数据导入脚本
- `scripts/update-coordinates.ts` - 坐标更新脚本
- `data/communities/` - 38个 Markdown 数据文件

**原因**
- 后台 CRUD 已能完全覆盖导入脚本功能
- 两个数据入口导致数据不一致风险
- 导入脚本使用 upsert 会覆盖后台修改的数据
- 减少维护成本

**更新**
- `package.json` - 移除 `import:communities` 和 `update:coordinates` 脚本
- `README.md` - 简化数据管理章节，删除 Markdown 相关说明

---

### 社区管理后台 CRUD 功能

完成社区数据的完整后台管理功能：

**新增功能**
- 后台新建社区（含表单验证）
- 编辑社区所有字段
- 删除社区
- 地图选点获取经纬度坐标
- 表单分组折叠（基本信息、位置、运营、标签服务、政策媒体）

**新增文件**
- `src/components/admin/tag-input.tsx` - 标签输入组件
- `src/components/admin/array-input.tsx` - 有序列表输入
- `src/components/admin/links-input.tsx` - 链接列表输入
- `src/components/admin/location-picker-map.tsx` - 百度地图选点组件
- `src/lib/validations/community.ts` - Zod 表单验证
- `src/app/admin/communities/community-form.tsx` - 统一表单组件
- `src/app/admin/communities/new/page.tsx` - 新建页面
- `src/app/admin/communities/[id]/page.tsx` - 详情页面
- `src/app/admin/communities/[id]/edit/page.tsx` - 编辑页面
- `src/app/api/admin/communities/check-slug/route.ts` - slug 唯一性检查

**更新文件**
- `src/app/api/admin/communities/route.ts` - 添加 POST 创建接口
- `src/app/api/admin/communities/[id]/route.ts` - 添加 GET/DELETE，扩展 PATCH
- `src/app/admin/communities/communities-client.tsx` - 添加操作按钮

---

## 2026-03-03

### 管理后台 + MODERATOR 角色权限

完成管理后台基础框架和角色权限系统：

**权限设计**
| 功能 | USER | MODERATOR | ADMIN |
|------|------|-----------|-------|
| 访问后台 | ❌ | ✅ | ✅ |
| 管理动态/订单 | ❌ | ✅ | ✅ |
| 管理用户/社区/资讯 | ❌ | ❌ | ✅ |

**新增文件**
- `src/lib/admin.ts` - 权限中间件 (requireStaff, requireAdmin, isStaff, isAdmin)
- `src/app/admin/layout.tsx` - 后台布局（角色菜单过滤）
- `src/app/admin/page.tsx` - 仪表盘
- `src/app/admin/users/` - 用户管理
- `src/app/admin/posts/` - 动态管理
- `src/app/admin/orders/` - 订单管理
- `src/app/admin/communities/` - 社区管理
- `src/app/admin/news/` - 资讯管理
- `src/app/api/admin/` - 管理 API 接口

---

### 搜索功能

实现全站搜索，覆盖动态、订单、社区、用户：

**新增文件**
- `src/app/api/search/route.ts` - 搜索 API
- `src/app/(main)/search/page.tsx` - 搜索结果页面
- 导航栏添加搜索图标入口

---

### 合作广场（原接单市场）

将"接单市场"重构为"合作广场"：

- 支持需求订单和合作需求两种类型
- 联系方式改为弹窗显示
- 优化列表和详情页 UI

---

### 点赞和评论功能

为动态和项目添加社交互动功能：

- 点赞/取消点赞
- 评论列表
- 评论发布
- 项目卡片快速点赞

---

## 2026-03-02

### 首页资讯模块

新增首页创业资讯展示：

- 自动抓取资讯数据（GitHub Actions）
- 分类展示：政策、融资、活动、技术、故事
- ISR 缓存优化

---

### 骨架屏加载优化

优化页面加载体验：

- 首页骨架屏
- 社区列表骨架屏
- ISR 增量静态再生成

---

### 关于/联系/隐私页面

新增静态页面：

- `/about` - 关于我们
- `/contact` - 联系我们
- `/privacy` - 隐私政策

---

## 待开发功能

- [ ] 通知系统
- [x] 消息私信
- [ ] 社区图片上传
- [ ] 用户头像上传
- [ ] 数据导出功能
