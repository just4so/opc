# CHANGELOG

## 2026-03-26 — Sprint 1 完整交付 + 性能优化专项

### Sprint 1：注册转化路径闭环

**注册自动登录 + 跳回来源页（commit: 2d81395）**
- 注册成功后自动调用 `signIn()`，跳回 `callbackUrl` 参数指定的来源页
- 未登录访问受保护页 → 登录/注册后直接回到原页面，不再跳首页

**社区详情页7处登录门控（commit: 151bbc2）**
- `LoginGate` 组件包裹：联系信息/政策详情/价格区间/交通指南/入驻流程/真实评价/收藏按钮
- 未登录只看简介，关键信息遮罩 + 注册CTA引导转化

### 全站视觉大改（commit: 8823004）
- 导航栏当前页高亮
- 社区卡片：封面图 + 城市首字色块占位（低饱和度）
- Hero 区暖色渐变背景
- 移动端底部注册 Bar
- 广场/合作广场视图切换
- 资讯分类色条
- 登录/注册双栏布局

### 工程卫生（commit: a7d1eb9）
- 删除 `src/` 镜像目录（曾有 Claude Code 误建）
- 修正 `tsconfig` `@/*` 别名指向根目录（而非 `./src/*`）
- 更新 `CLAUDE.md` 明确"无 src/ 目录"规则

### 首页数据优化（commit: c800189）
- 热门城市从硬编码改为数据库动态查询
- 删除假数据广场帖，改用真实数据库内容
- 加 `metadata`，`revalidate` 改为 300

---

### 社区列表页 UX 改进系列（commits: 1d9cd13 → c8d5f79 → eec4d64 → 837d24d）

**地图 & 视图**
- 默认显示列表视图（不是地图）
- 地图视图下不渲染卡片列表（两种视图语义分离）
- 地图视图切城市：使用 `centerAndZoom` 一步定位（原 `panTo+setZoom` 有竞态 bug）
- 切城市不再闪列表：地图始终渲染，loading 改为半透明 overlay

**城市筛选架构改造**（关键决策）
- `selectedCity` 改为纯 client state，城市切换不触发 `router.push`
- 彻底解决地图重载问题（URL 变化会触发 Server Component 重新渲染 + 地图实例重建）
- 分页仍用 `?page=N` URL 参数（不影响地图）

**全国中心坐标修正**
- 原：`104.5, 35.5`（定西市）→ 改为：`108.0, 34.0`（陕西，正确全国视野）

**城市 Tab 设计**
- 去掉数量、去掉星级，白色背景 pill，选中橙色高亮
- 地图图钉改为橙色 SVG 自定义样式

**Header 合并重设计**
- 标题行（含视图切换按钮）+ 城市 pill 行合并为一个 `border-b` 区域

---

### 性能优化专项（commits: 326743c → ee191e5 → 7612e81 → b0472e0）

**社区列表页（ee191e5）**
- SSR 一次性传全量 104 条社区数据（71.5KB）给前端
- 城市筛选 + 分页全部前端完成，不再调 `/api/communities`
- 城市切换从 400-800ms → 即时响应
- `revalidate = 3600`

**社区详情页（7612e81）**
- 加 `generateStaticParams()` 预生成全部 104 个静态页
- `revalidate = 3600`
- 生产环境 TTFB：~600ms → ~10ms（CDN 直出）

**资讯列表（7612e81）**
- `findMany` 加 `select`，去掉 `content` 字段
- 列表页传输量减少约 80%

**创业广场（b0472e0）**
- `force-dynamic` → `revalidate = 60`（60秒 ISR）
- 首屏从每次打数据库 → CDN 命中（生产环境）

**合作广场（b0472e0）**
- Client Component（`useEffect + fetch /api/market` 串行）→ Server Component
- 直接 Prisma 查询，去掉一次 fetch 往返延迟
- 筛选改为 URL searchParams 驱动（`?type=DEMAND&category=xxx`）
- `revalidate = 120`

**数据库连接**
- DATABASE_URL 端口 5432 → 6543（pgBouncer Transaction mode）
- 加 `?pgbouncer=true`（Prisma 兼容 pgBouncer 必须）
- DIRECT_URL 保持 5432（prisma migrate 专用直连）
- ⚠️ Netlify 线上环境变量需手动更新

---

### 上线 Checklist

- [ ] Netlify 环境变量配置（DATABASE_URL/DIRECT_URL/NEXTAUTH_URL/NEXTAUTH_SECRET/NEXT_PUBLIC_BMAP_KEY）
- [ ] `git push origin main`（已推，Netlify 自动构建）
- [ ] 部署后验证：首页 / 社区详情 / 注册流程 / LoginGate 遮罩
