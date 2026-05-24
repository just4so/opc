# V2 视觉修复方案（顶级设计标准）

按严重度排序，每项给出文件、当前代码、目标代码。

---

## 🔴 P0 — 致命（上线前必修）

### Fix-01: 登录/注册页 logo 白底问题
**文件：** `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
**问题：** `logo.png` 是 RGB 格式无透明通道（1200×630），放在橙色渐变背景上白底矩形完全暴露
**方案：** 用 `logo-transparent.png`（已生成，RGBA，白色背景已去透明）
```
当前：<img src="/logo.png" alt="OPC圈" className="h-16 mb-8" />
改为：<img src="/logo-transparent.png" alt="OPC圈" className="h-16 mb-8" />
```
右侧表单区的小 logo 同理：
```
当前：<img src="/logo.png" alt="OPC圈" className="h-8" />
改为：<img src="/logo-transparent.png" alt="OPC圈" className="h-8" />
```

### Fix-02: 登录页 emoji 列表图标换 SVG
**文件：** `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
**问题：** ✅ emoji 做列表图标不专业
**方案：** 用 lucide `Check` 图标 + 小圆底
```tsx
// 当前
<li className="flex items-center gap-2">✅ 全国 110+ 个 OPC 社区攻略</li>

// 改为
import { Check } from 'lucide-react'
<li className="flex items-center gap-3">
  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
    <Check className="h-3 w-3" />
  </span>
  全国 180+ 个 OPC 社区攻略
</li>
```
同时把 "110+" 改成 "180+"（接近实际 183，用整数不硬编码精确值）

### Fix-03: 首页价值卡片去掉 ✓ / ∞
**文件：** `app/(main)/page.tsx` 价值卡片区
**问题：** "✓" 和 "∞" 太抽象，用户不知道什么意思
**方案：** 去掉大数字焦点，改为 lucide 图标 + 标题层级调大
```tsx
// 当前
{ num: '✓', title: '认证创业者，被行业看见', ... }
{ num: '∞', title: '创业者广场，找到合作', ... }

// 改为三张卡片结构：
{
  icon: Building2,  // lucide
  title: `${stats.total} 个社区，帮你对接入驻`,
  desc: `覆盖 ${stats.cityCount} 个城市，真实信息人工核实`,
  href: '/communities',
},
{
  icon: BadgeCheck,
  title: '认证创业者，被行业看见',
  desc: '展示你的项目，获得认证标识，进入行业推荐视野',
  href: '/plaza',
},
{
  icon: Handshake,
  title: '创业者广场，找到合作',
  desc: '和真实创业者连接，发布需求，找到伙伴',
  href: '/plaza?tab=products',
},

// 每张卡片渲染
<div className="bg-canvas p-10 hover:bg-surface-soft transition-colors group">
  <card.icon className="h-8 w-8 text-primary mb-5" strokeWidth={1.5} />
  <h3 className="text-xl font-bold text-ink mb-2">{card.title}</h3>
  <p className="text-sm text-mute leading-relaxed mb-4">{card.desc}</p>
  <Link href={card.href} className="text-sm text-primary font-medium group-hover:underline">
    了解更多 →
  </Link>
</div>
```

### Fix-04: 社区列表推荐社区始终展开
**文件：** `components/communities/communities-page-client.tsx`
**问题：** 全部折叠，用户看到一排灰色条带，看不到内容
**方案：**
1. 推荐社区始终展开，不可折叠
2. 推荐社区区块用不同视觉处理（浅橙底 + 边框）
3. 前 3 个省份默认展开（已有逻辑确认）
```tsx
// 推荐社区区块
{group.province === '推荐社区' ? (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
      <Star className="h-5 w-5 text-primary" />
      推荐社区
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {group.communities.map(c => <CommunityCard ... />)}
    </div>
  </div>
) : (
  // 普通省份折叠逻辑保持
)}
```

### Fix-05: Footer logo 深色底适配
**文件：** `app/(main)/layout.tsx`
**问题：** logo-wordmark.png 是深色文字，在深色 footer 上可能看不清
**方案：** Footer 使用白色版 logo
```
当前：<Image src="/logo-wordmark.png" ...
改为：<Image src="/logo-wordmark-white.png" ...
```

---

## 🟡 P1 — 重要（视觉品质提升）

### Fix-06: 导航间距加大
**文件：** `app/(main)/layout.tsx`
**当前：** `space-x-1`（4px）
**改为：** `space-x-2`（8px）
```
<nav className="hidden md:flex items-center space-x-2">
```

### Fix-07: 导航选中态改为下划线
**文件：** `components/layout/nav-links.tsx`
**当前：** 橙色药丸底 `bg-primary-50`
**改为：** 底部 2px 橙色线 + 字色加深
```tsx
// 当前 active
"px-4 py-2 text-sm font-medium text-primary bg-primary-50 rounded-2xl"

// 改为 active
"px-4 py-2 text-sm font-semibold text-ink border-b-2 border-primary rounded-none"

// 当前 inactive  
"px-4 py-2 text-sm font-medium text-mute hover:text-primary hover:bg-primary-50 rounded-2xl transition-all"

// 改为 inactive
"px-4 py-2 text-sm font-medium text-mute hover:text-ink border-b-2 border-transparent transition-all"
```

### Fix-08: Hero 标题放大 + 渐变方向修正
**文件：** `app/(main)/page.tsx`, `app/globals.css`
**改动：**
- 标题：`text-[52px] md:text-[56px]` → `text-[56px] md:text-[68px]`
- 渐变：`linear-gradient(135deg, ...)` → `linear-gradient(90deg, #F97316, #FB923C, #F97316)`（水平）
- 光晕：`blur(40px)` → `blur(80px)`（更弥散）
- 网格：`background-size: 80px 80px` → `100px 100px`，`rgba(0,0,0,0.03)` → `rgba(0,0,0,0.02)`（更细更稀）

### Fix-09: 价值卡片间距 + hover 效果
**文件：** `app/(main)/page.tsx`
**当前：** `gap-px`（1px 假分割线）
**改为：** `gap-6`（24px 真间距）+ 每张卡片独立圆角 + hover 上移
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {cards.map(card => (
    <Link href={card.href} key={card.title}
      className="bg-canvas rounded-2xl p-10 border border-hairline-soft 
        hover:border-transparent hover:shadow-soft hover:-translate-y-1 transition-all duration-300 group">
      ...
    </Link>
  ))}
</div>
```

### Fix-10: 深色数据区过渡
**文件：** `app/(main)/page.tsx`
**方案：** 在深色区块上下各加一个渐变过渡条
```tsx
{/* 渐变过渡：浅→深 */}
<div className="h-24 bg-gradient-to-b from-canvas to-surface-dark" />
<section className="bg-surface-dark py-[80px] px-6 relative overflow-hidden">
  ...
</section>
{/* 渐变过渡：深→浅 */}
<div className="h-24 bg-gradient-to-b from-surface-dark to-canvas" />
```

### Fix-11: 副标题去掉强制换行
**文件：** `app/(main)/page.tsx`
**当前：** `全国 ... <br /> 真实信息...`
**改为：** 一段文字自然流动
```tsx
<p className="text-[17px] text-mute leading-relaxed mb-11 max-w-[480px] mx-auto">
  全国 {stats.total} 个 OPC 社区 · 覆盖 {stats.cityCount} 个城市 · 真实信息人工核实，一键对接入驻
</p>
```

### Fix-12: 次级 CTA 边框加深
**文件：** `app/(main)/page.tsx`
**当前：** `border-hairline-soft`
**改为：** `border-hairline`

### Fix-13: 资讯页骨架屏旧 class
**文件：** `app/(main)/news/page.tsx`
**当前：** `bg-gray-200`（5处）
**改为：** `bg-hairline-soft`

### Fix-14: 社区列表页标题放大
**文件：** `components/communities/communities-page-client.tsx`
**当前：** `text-2xl`（24px）
**改为：** `text-3xl md:text-4xl`（30/36px）

---

## 🟠 P2 — 锦上添花

### Fix-15: 深色数据区字距调整
**当前：** `tracking-[-3px]`
**改为：** `tracking-[-2px]`

### Fix-16: 创业者卡片头像颜色多样化
**方案：** 根据用户 ID hash 选择不同颜色（蓝/绿/紫/橙），避免全部橙色

### Fix-17: Tab 选中态加强（广场）
**方案：** 选中 Tab 加底部 2px 指示线 + 字重加粗

### Fix-18: 空状态设计
**方案：** 产品 Tab 无数据时显示插画 + "成为第一个展示产品的创业者"

---

## 执行顺序

1. 先修 P0（5项）— 最多 1 个 ACP
2. 再修 P1（9项）— 1 个 ACP
3. P2 上线后迭代
