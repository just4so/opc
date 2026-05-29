# Phase 3 T6: 直通车表单 + 广场改造 + 通知横条

## 背景

PRD 第六、七章。三个独立改动：
1. 直通车 Step2 表单字段调整
2. 广场默认 tab 改为产品 + 排序下拉 + 筛选区
3. 广场顶部通知横条

参考文件：
- `docs/community-upgrade-phase3-prd.md` 第六、七章
- `CLAUDE.md` — 设计约束
- `components/connect/connect-form.tsx` — 直通车表单
- `components/connect/step2-form.tsx` — Step2 表单 UI
- `app/api/inquiries/route.ts` — 创建 Inquiry + Project
- `components/plaza/plaza-client.tsx` — 广场客户端组件
- `app/(main)/plaza/page.tsx` — 广场服务端页面

## 设计约束（硬规则）

- 只用 DESIGN.md tokens
- 不引入新 npm 包
- 不新增 Tailwind 自定义颜色

---

## Task 1: 直通车 Step2 表单改造

修改 `components/connect/connect-form.tsx`：
- `productTagline` → `productDescription`（字段名改）
- maxLength 从 300 → 1000
- label 改为"产品描述"

修改 `components/connect/step2-form.tsx`：
- 对应 label/placeholder 更新
- textarea 改为更大的输入区域（rows=4）
- 新增图片上传区域（复用 `components/ui/image-upload.tsx`，endpoint="/api/upload/product-image"，maxImages=5）

修改 `app/api/inquiries/route.ts`：
- 接收 `productDescription` 和 `images` 字段
- 创建 Project 时：`description = productDescription`，`images = images[]`
- 不再写入 tagline

## Task 2: 广场默认 Tab 改为产品

修改 `components/plaza/plaza-client.tsx`：
- 默认 tab 从 `'people'` 改为 `'products'`
- Tab 顺序改为：产品 | 动态 | 创业者
- URL 参数逻辑：无 tab 参数时默认 products

## Task 3: 广场排序下拉

在 `components/plaza/plaza-client.tsx` 每个 tab 右上角加排序下拉：

**产品排序：**
- 最新发布（默认，createdAt DESC）
- 最多喜欢（likeCount DESC）
- 最近更新（有新 Progress 的排前面）

**创业者排序：**
- 最新加入（默认）
- 最多粉丝（followerCount DESC）
- 最近活跃

**动态排序：**
- 最新发布（默认）
- 最多互动（likeCount + commentCount DESC）

样式：小字下拉 "排序: 最新发布 ▾"，用 `<select>` 或自定义下拉。

需要修改对应的 API 路由支持 sort 参数：
- `app/api/plaza/projects/route.ts` — 加 sort 参数
- `app/(main)/plaza/page.tsx` — 传 sort 到客户端

## Task 4: 广场通知横条

在广场顶部（tab 栏上方）加一个通知横条：
- 内容：最近 24h 事件（"xxx 发布了新产品"、"xxx 记录了新进展"、"xxx 加入了 OPC圈"）
- 样式：单行，文字左右滚动（CSS animation marquee）或淡入淡出
- 数据源：从现有 createdAt 字段查最近 24h 的 User/Project/Progress 记录
- 无事件时显示："欢迎来到 OPC 创业者广场"
- 背景色：surface-soft，文字 mute，高度固定避免布局跳动

创建 `components/plaza/notification-ticker.tsx`：
- Server Component 或在 page.tsx 查数据传入
- 最多展示 5 条事件轮播

修改 `app/(main)/plaza/page.tsx`：
- 查询最近 24h 事件
- 渲染 NotificationTicker

---

## 验收标准

- [ ] `npm run build` 通过
- [ ] 直通车 Step2 有"产品描述"（1000字）+ 图片上传
- [ ] 广场默认展示产品 tab
- [ ] 三个 tab 都有排序下拉且生效
- [ ] 广场顶部有通知横条（有/无事件两种状态）
- [ ] URL 参数持久化（tab + sort）
