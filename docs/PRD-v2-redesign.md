# opcquan.com 改版 PRD v5

> 版本:v5.2(v5.1 + 代码对照审查 11 项修正)
> 日期:2026-05-22
> 状态:草案,待最终确认
> 作者:闹闹虾 + 阿良哥

---

## 一、改版目标

**从「内容展示站」变成「创业者信息收集 + 服务对接平台」。**

核心指标:
- 用户留资率(访问社区详情页 → 提交直通车的转化率)
- 创业者卡片数量(广场活跃度)
- Inquiry 跟进转化率(留资 → 实际对接成功)

---

## 二、核心决策(已确认)

| 决策 | 结论 | 确认时间 |
|------|------|---------|
| 网站流量主入口 | 找社区(社区信息全面真实是核心竞争力)| 5/21 |
| 信息收集方式 | 社区直通车(独立收集页面,需登录)| 5/22 |
| 联系方式获取 | **登录 + 提交过至少一次直通车 → 解锁全部社区联系方式** | 5/22 |
| 直通车登录要求 | **必须登录才能使用直通车** | 5/22 |
| 创业者卡片 | 不是独立动作,是直通车的附带产物(勾选即创建)| 5/21 |
| 卡片结构 | 人 = 卡片主体,Project 是附属(0 或多个)| 5/22 |
| 卡片可编辑 | 必须允许,个人中心编辑 + 下架开关 | 5/22 |
| 卡片创建路径 | 两条独立路径:直通车勾选 或 /settings 页面手动创建 | 5/22 |
| 三个驱动端 | 用户无感知,后台统一处理(对接/曝光/认证)| 5/21 |
| AI 对话 | 不做 | 5/21 |
| 入驻攻略 | 不做独立板块 | 5/21 |
| 工具导航 | 降级,不占主导航 | 5/21 |
| 城市选择 | 不做独立的城市对比页 | 5/21 |
| skills 字段 | 废弃,全端不再使用 | 5/22 |
| 冷启动策略 | 先靠社区流量喂卡片 + 伪造一批种子卡片 | 5/22 |
| Project 模型 | 复用现有 schema,前端做减法 | 5/22 |
| BP 文件 | 关联到 Inquiry,不公开展示 | 5/22 |

---

## 三、登录前后内容差异化

**核心原则:社区基本面公开,联系方式需登录+留资才能获取。**

> **设计理由:** 联系方式是用户采取行动的关键信息,和留资绑定可以确保每个获取联系方式的用户都留下了自己的信息。同时"提交一次解锁全部"降低了用户摩擦--只需填一次表单。

### 三层权限模型

| 信息 | 未登录 | 已登录(未提交直通车) | 已登录(已提交过直通车) |
|------|--------|----------------------|------------------------|
| 社区基本信息 | ✅ | ✅ | ✅ |
| 入驻友好度、入驻福利 | ✅ | ✅ | ✅ |
| 联系人姓名 | ✅ | ✅ | ✅ |
| **联系人电话/公众号** | **❌ 模糊** | **❌ 模糊** | **✅ 全部社区可见** |
| 入驻细节(费用、流程) | ❌ 部分隐藏 | ✅ 完整可见 | ✅ 完整可见 |
| 用户评价 | 显示 1-2 条 | 全部可见 | 全部可见 |
| 创业者广场-联系TA | ❌ 提示登录 | ✅ 走私信 | ✅ 走私信 |

### 解锁逻辑(技术实现)

```
判断条件:SELECT count(*) FROM Inquiry WHERE userId = 当前用户 AND status != 'CANCELLED'
  count > 0 → 联系方式全局解锁(所有社区详情页)
  count = 0 → 联系方式模糊化
```

不需要额外字段,不需要 per-社区判断,一次查询搞定。查询结果可缓存在 session 中。

---

## 四、信息架构

### 导航结构

```
OPC圈(logo)  |  找社区  |  创业者广场  |  OPC雷达    [创建卡片/登录]
```

### 页面清单

| 路由 | 功能 | 状态 | 所属阶段 |
|------|------|------|---------|
| `/` | 首页(分流器)| 重写 | P1 |
| `/communities` | 社区列表/地图 | 保留,微调 | P0 |
| `/communities/[slug]` | 社区详情(加直通车入口)| 改造 | P0 |
| `/connect/[slug]` | 社区直通车(指定社区)| **新建** | P0 |
| `/connect` | 通用直通车(不指定社区)| **新建** | P1 |
| `/plaza` | 创业者广场(卡片墙 + 动态流)| 重构 | P1 |
| `/plaza/[id]` | 帖子详情 | 保留 | - |
| `/profile/[username]` | 用户主页 = 卡片详情页 | 改造 | P1 |
| `/settings` | 个人设置(已有)+ 新增卡片管理 Section | 改造 | P1 |
| `/radar` | OPC雷达 | 保留不动 | - |
| `/radar/[issueNo]` | 雷达期刊详情 | 保留不动 | - |
| `/news` | 创业资讯 | 保留,降级 | - |
| `/news/[id]` | 资讯详情(底部加行动 CTA)| 微调 | P1 |
| `/tools` | 工具导航 | 保留,降级 | - |
| `/admin/inquiries` | 后台:意向管理看板 | **新建** | P0 |
| `/admin/verify` | 后台:认证审核 | **新建** | P2 |

### 删除/合并的页面

| 原页面 | 处理 | 所属阶段 |
|--------|------|---------|
| `/market` | 页面已不存在,清理 middleware + components/market/ 残留 | P0 |
| `/start` | 删除 | P1 |

---

## 五、各页面详细设计

---

### 5.1 首页 `/`(P1)

**目标:** 让用户在 5 秒内决定去「找社区」还是「看广场」。好奇型用户也有出路。

**结构:**

```
[第一屏] Hero
  主标题:OPC创业者,在这里找到社区、被行业看见。
  两个 CTA:
    [找社区入驻] → /communities
    [展示我的项目] → 已登录 → /settings#card;未登录 → 注册页(注册后跳 /settings#card)
  探索引导(小字):
    不确定?先看看 183 个 OPC 社区的分布 →

[第二屏] 平台价值(三个可点击卡片)
  🏢 183个社区,帮你对接入驻 → /communities
  📣 认证创业者,进入媒体推荐池 → /connect(P1 上线后)
  🤝 创业者广场,找到合作伙伴 → /plaza

[第三屏] 最新创业者卡片(3-4张,从广场拉取)

[第四屏] OPC雷达最新一期预览

[第五屏] 底部:资讯/工具入口 + footer
  footer:「你是社区运营方?联系我们 →」(P2 功能化)
```

**技术:** Server Component,ISR revalidate=600
**响应式:** 手机端 Hero CTA 竖排堆叠,价值卡片纵向排列

---

### 5.2 找社区 `/communities`(P0 微调)

**保留现有列表/地图功能,微调:**
- 页面顶部加引导文案:「选好社区后,我们帮你直接对接」
- 列表底部加:「没找到你的社区?联系我们提交收录 →」(P0 放静态文案+微信号,P2 功能化)

---

### 5.3 社区详情页 `/communities/[slug]`(P0 核心改造)

**现有内容保留:** 社区信息、政策侧边栏、评价区

**改造 1:联系人信息 + 直通车入口**

**未解锁状态(未登录 或 已登录但没提交过直通车):**
```
┌─────────────────────────────────────────┐
│  联系人:王经理                          │
│  电话:**** ****                         │
│  微信:****                              │
│                                         │
│  [🟢 社区直通车 - 提交意向,获取联系方式]  │
│  登录并提交入驻意向后,立即解锁全部社区     │
│  联系方式,1个工作日内专人帮你对接          │
└─────────────────────────────────────────┘
```
- 未登录用户点直通车 → 弹出登录/注册框(不跳页)→ 登录后自动进入 `/connect/[slug]`
- 已登录未解锁用户点直通车 → 直接进入 `/connect/[slug]`

**已解锁状态(已登录且提交过至少一次直通车):**
```
┌─────────────────────────────────────────┐
│  联系人:王经理                          │
│  电话:138-xxxx-xxxx                     │
│  公众号:wang_community                   │
│                                         │
│  [🟢 社区直通车 - 提交意向,专人帮你对接]  │
└─────────────────────────────────────────┘
```
- 联系方式完整展示
- 直通车按钮仍可见(用于对该社区表达入驻意向,获得专人对接服务)

**改造 2:入驻细节差异化**
- 未登录时入驻细节部分折叠,提示「登录查看完整信息」
- 评价区未登录时只显示 1-2 条

**改造 3:手机端底部悬浮按钮**
- 移动端增加底部悬浮 `[🟢 社区直通车]` 按钮,始终可见

**社区无联系方式的特殊处理:**
- 如果该社区的联系人电话/公众号为空,不展示联系人区块
- 直通车按钮文案改为:「🟢 社区直通车 - 提交意向,专人帮你对接」
- 直通车提交成功页不展示联系方式区块,只显示"我们会在 1 个工作日内帮你联系该社区"

---

### 5.4 社区直通车 `/connect/[slug]`(P0 新建,核心页面)

**前置条件:必须登录。** 未登录用户点击直通车时先弹登录框。

**第一步(必填,30 秒完成):**

```
┌──────────────────────────────────────────────────┐
│  🟢 快速对接:[社区名称]                          │
│                                                  │
│  提交后立即解锁全部社区联系方式,                    │
│  1 个工作日内专人帮你对接。                         │
│                                                  │
│  你的称呼:[______](自动填充 user.name)           │
│  联系方式(微信/手机):[______](自动填充)         │
│  所在城市:[带搜索的下拉选择](自动填充 user.location)│
│                                                  │
│  [下一步]                                         │
└──────────────────────────────────────────────────┘
```

- 已登录用户信息自动填充(name, wechat/phone, location)
- 城市下拉:全国主要城市列表(省会+地级市),带搜索(Combobox)

**第二步(选填,愿意填就填):**

```
┌──────────────────────────────────────────────────┐
│  帮我们更好地帮你对接:                            │
│                                                  │
│  你在做什么方向:[一句话]                          │
│  当前阶段:[还在想/已注册公司/已有收入]              │
│  上传 BP(选填,最大 30MB,PDF/DOC/DOCX):[上传]   │
│                                                  │
│  ☐ 同时在创业者广场展示我的信息                     │
│    (让其他 OPC 创业者看到你,找到合作机会)         │
│  ☐ 申请 OPC 创业者认证                             │
│    (认证后进入媒体推荐池,有机会被                  │
│     中国经营报、中国城市报等报道)                   │
│                                                  │
│  [提交]  [跳过,先提交基本信息]                     │
└──────────────────────────────────────────────────┘
```

**提交成功页:**

```
┌──────────────────────────────────────────────────┐
│  ✅ 已收到!                                      │
│                                                  │
│  📞 社区联系方式已解锁:                            │
│  联系人:王经理                                    │
│  电话:138-xxxx-xxxx                              │
│  公众号:wang_community                            │
│  (社区无联系方式时:我们会在 1 个工作日内            │
│   帮你联系该社区并通过微信告知你)                   │
│                                                  │
│  你已解锁全部社区联系方式,可直接查看任意社区。       │
│                                                  │
│  急需对接?添加小助手微信,即时沟通:                │
│  微信号:opcquan01(点击复制)                      │
│                                                  │
│  [继续浏览其他社区 → /communities]                  │
│  [看看其他创业者在做什么 → /plaza]                   │
│                                                  │
│  (如勾选了广场展示:)                             │
│  🎉 你的创业者卡片已创建!去看看 →                   │
└──────────────────────────────────────────────────┘
```

**交互逻辑:**

- **自动填充:** 从 User 记录读取已有信息预填,用户可修改。**若 user.name 为空,称呼字段不预填,用户必须手填。**
- **提交后写入 User:** 直通车中填写的信息同步更新 User 对应字段(city → user.location, introduction → user.mainTrack, stage → user.startupStage, contact → user.wechat 或 user.phone)
- **勾选展示 →** User.showInPlaza = true,卡片数据来自 User 字段
- **勾选认证 →** 进入后台审核队列
- **BP 上传:** P0 不实现,显示灰态「即将支持」。P1 上线 R2 基础设施后启用
- **重复提交保护:** 该用户对同一社区已有 PENDING/CONTACTED 状态的 Inquiry → 提示「你已提交过该社区的对接意向,当前状态:已联系」,可选择重新提交或返回
- **提交后全局解锁:** 前端刷新用户的"是否有 Inquiry"状态,后续所有社区详情页联系方式可见

**SEO:** `<meta name="robots" content="noindex">`

---

### 5.5 通用直通车 `/connect`(P1 新建)

**与 `/connect/[slug]` 的区别:**
- 第一步多一个字段:「意向社区」下拉选择(Combobox 带搜索,含"不确定,帮我推荐"选项)
- 选择"帮我推荐"时,communityId 为空,communityName 存为"待推荐"
- 成功页不展示社区联系方式(因为未指定社区),改为"我们会在 1 个工作日内推荐适合你的社区"

**入口(P1 加):**
- 首页第二屏"认证创业者"卡片 → /connect
- 资讯文章底部 CTA → /connect

其他逻辑与 `/connect/[slug]` 完全一致。

---

### 5.6 创业者广场 `/plaza`(P1 重构)

**定位:** 创业者卡片墙 + 轻量动态流

**冷启动策略:**
- P1 上线前运营方伪造 20-30 张种子卡片
- 卡片 30+ 后在直通车勾选框旁启用社会证明文案:「已有 XX 位创业者展示中」
- 卡片 50+ 后开始广场独立推广

**页面结构:**

```
[顶部] 筛选栏
  按需求筛:全部 / 找合作 / 找客户 / 找社区 / 找资源
  按方向筛:全部 / AI / 内容 / 设计 / 电商 / ...
  按城市筛:全部 / 北京 / 杭州 / 深圳 / ...

[主体] 双轨展示

  [Tab 1: 创业者卡片](默认)
    查询条件:User WHERE showInPlaza = true
    网格展示(手机端单列):

    ┌──────────────────────────────────┐
    │  [头像]  张三  ✅已认证           │
    │  AI 写作工具 · 北京               │
    │  「帮自媒体创作者提效 10 倍」      │
    │                                  │
    │  🔍 找:合作伙伴、种子用户         │
    │  💡 能提供:AI技术、内容生产经验    │
    │                                  │
    │  [查看详情]  [联系TA]             │
    └──────────────────────────────────┘

    [联系TA]:
    - 未登录 → 提示登录
    - 已登录 → 触发站内私信(复用现有私信系统)

  [Tab 2: 动态]
    现有帖子功能保留
    前端简化展示为:💬 聊聊 / 🤝 找合作
    (PostType 枚举不改,仅前端归类)

[右上角] 发布按钮
  → 已有卡片(showInPlaza=true)→ 直接发动态
  → 无卡片 → 引导去 /settings 创建卡片
```

---

### 5.7 卡片详情页 `/profile/[username]`(P1 改造)

```
[基本信息]
  头像 + 名字 + 认证 badge(如有)
  城市 · 方向 · 阶段
  一句话介绍(bio)

[我在做什么]
  mainTrack 展开说明

[我在找 / 我能提供]
  lookingFor / canOffer 标签展示

[我的项目](如有关联 Project)
  每个项目:名字 · tagline · 阶段 · 链接
  ContentType 区分:PROJECT / DEMAND / COOPERATION

[TA 发过的动态]
  最近发布的帖子列表

[联系TA]
  未登录 → 提示登录
  已登录 → 站内私信(复用现有)

[卡片完善度提示](仅本人可见)
  「补充项目介绍,获得更多曝光 →」
  进度条显示完善百分比
```

**OG Meta:** title=「{name} - {mainTrack} | OPC圈」, description=bio, image=avatar

---

### 5.8 个人设置 `/settings` - 新增「创业者卡片」区块(P1 改造)

**现有 `/settings` 页面已支持编辑个人资料(昵称、bio、头像、位置等)。改版新增一个 Section,不新建页面。**

**新增 Section:创业者卡片管理**

> 不依赖 Inquiry,任何已登录用户可直接使用。与现有个人资料编辑共用同一批字段(bio/location/lookingFor/canOffer),避免两个页面改同一组数据。

**可编辑字段:**
- 一句话介绍(bio)
- 我在做什么方向(mainTrack)
- 当前阶段(startupStage)
- 所在城市(location)
- 我在找什么(lookingFor)- 多选标签
  - 预设:找社区入驻 / 找合作伙伴 / 找客户 / 找投资 / 找技术支持 / 找曝光机会 / 其他
- 我能提供什么(canOffer)- 多选标签
  - 预设:技术开发 / 设计 / 内容创作 / 市场营销 / 财务法务 / 行业资源 / 其他
- 联系方式(wechat)

**展示控制:**
- **广场展示开关:** 「在创业者广场展示我的卡片」可开/关
- 关闭后卡片从广场列表隐藏,但 `/profile/[username]` 仍可访问

**关联 Project 管理:**
- 添加 / 编辑 / 删除自己的项目
- 最小字段集:名字(name)、一句话介绍(tagline)、阶段(stage)、链接(website)
- 类型选择:项目(PROJECT)/ 需求(DEMAND)/ 合作(COOPERATION)

**完善度引导:**
- 完善度 = 已填字段数 / 总字段数(bio, mainTrack, startupStage, location, lookingFor, canOffer, 至少一个 Project)
- 按优先级提示缺失项

---

### 5.9 用户注册/登录流程(微调)

**保持现有注册流程不变:**

现有代码已实现的注册字段(不改):
- 昵称(name)- 必填,2-20字符,@unique
- 手机号(phone)- 必填
- 密码(password)- 必填,♧6位
- 邮箱(email)- 选填
- 当前阶段(startupStage)- 选填
- 方向(mainTrack)- 选填
- username - 系统自动生成(user_ + 随机串)

**废弃字段:** `skills` - 前端去掉所有展示和收集入口。

**已有功能确认(不需要额外开发):**
- ✅ 注册/登录后回跳:middleware.ts 已支持 callbackUrl
- ✅ 忘记密码:/forgot-password + /reset-password 已实现

---

### 5.10 资讯详情页 `/news/[id]`(P1 微调)

**文章底部加通用行动 CTA:**
```
─────────────────────────────────────
  想入驻 OPC 社区?一键对接 →
  [社区直通车] → /connect
─────────────────────────────────────
```

---

## 六、响应式和手机端设计要求

| 页面 | 手机端特殊处理 |
|------|---------------|
| 首页 | Hero CTA 竖排堆叠,价值卡片纵向排列 |
| 社区列表 | 默认列表模式,地图作为切换选项 |
| 社区详情 | **底部悬浮「社区直通车」按钮**,始终可见 |
| 直通车 | 表单字段全宽,城市用 Combobox |
| 广场 | 卡片单列展示 |
| 卡片详情 | 正常响应式 |

---

## 七、数据模型变化

### 新增:Inquiry(入驻意向表)

```prisma
model Inquiry {
  id              String        @id @default(cuid())
  userId          String        // 必须登录,直接关联
  communityId     String?       // 意向社区(通用直通车时为空)
  communityName   String?       // 社区名称快照("待推荐" 当无指定社区时)
  name            String        // 称呼
  contact         String        // 微信或手机
  city            String?       // 所在城市
  introduction    String?       // 一句话介绍(第二步选填)
  stage           String?       // 当前阶段(第二步选填)
  wantCard        Boolean       @default(false)
  wantVerify      Boolean       @default(false)
  bpUrl           String?       // R2 私有路径
  bpFilename      String?
  status          InquiryStatus @default(PENDING)
  source          String?       // 来源页面 URL
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  user            User          @relation(fields: [userId], references: [id])
  community       Community?    @relation(fields: [communityId], references: [id])

  @@index([status])
  @@index([communityId])
  @@index([userId])              // 解锁判断 + 重复检查
  @@index([userId, communityId]) // 重复提交检查
  @@index([createdAt])
}

enum InquiryStatus {
  PENDING     // 待跟进
  CONTACTED   // 已联系
  DONE        // 已完成
  CANCELLED   // 已取消
}
```

**注意:** userId 为必填(String 非 String?),因为直通车必须登录。

### 现有模型改动

**User:**
- 废弃 `skills`(schema 保留,全端不用)
- **新增字段:** `showInPlaza Boolean @default(false)` - 广场展示开关
- 新增关联:`inquiries Inquiry[]`
- 其他字段不改

**Community:**
- 新增关联:`inquiries Inquiry[]`

**Project:** 不改 schema
- 前端只暴露:name, tagline, description, stage, website, category, contentType, logo, contactInfo

**Post:** 不改 schema
- 前端归类:💬 聊聊 / 🤝 找合作

---

## 八、API 接口定义

### 8.1 直通车提交

```
POST /api/inquiries
  权限:已登录(NextAuth session)
  请求体:
  {
    communitySlug?: string,       // 指定社区的 slug(通用直通车时省略)
    name: string,                // 称呼
    contact: string,             // 手机号或公众号
    city?: string,               // 所在城市
    introduction?: string,       // 方向(第二步)
    stage?: string,              // 阶段(第二步)
    wantCard?: boolean,          // 展示在广场
    wantVerify?: boolean,        // 申请认证
    source?: string              // 来源 URL(前端自动带入)
  }
  后端逻辑:根据 communitySlug 查询 Community,拿到 id 和 name 写入 Inquiry
  返回:
  {
    id: string,
    communityContact?: {         // 仅当 communitySlug 有值且社区有联系方式时返回
      name: string,
      phone?: string,
      wechat?: string            // 实际为公众号
    },
    unlocked: true               // 标识联系方式已全局解锁
  }
  错误:
  - 401: 未登录
  - 409: 该用户对同一社区已有 PENDING/CONTACTED 状态的 Inquiry
         返回 { existing: { id, status, createdAt } }
```

### 8.2 BP 上传(P1,依赖 R2 基础设施)

> P0 阶段直通车第二步的 BP 上传区域显示为「即将支持」灰态,不阻塞表单提交。P1 实现时需先新增 `lib/r2.ts`(S3Client + 上传 + 签名 URL),安装 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`。

```
POST /api/inquiries/upload-bp
  权限:已登录
  请求:multipart/form-data,字段名 file
  限制:最大 30MB,格式 PDF/DOC/DOCX
  返回:{ bpUrl: string, bpFilename: string }
  存储:R2 路径 opcquan-media/inquiries/bp/{userId}/{timestamp}-{filename}
```

### 8.3 联系方式解锁查询

```
GET /api/user/unlock-status
  权限:已登录
  返回:{ unlocked: boolean }
  逻辑:SELECT count(*) FROM Inquiry WHERE userId = ? AND status != 'CANCELLED' > 0
```

### 8.4 后台 Inquiry 管理

```
GET /api/admin/inquiries
  权限:STAFF(ADMIN + MODERATOR,复用现有 isStaff)
  查询参数:status, city, communityId, page, pageSize
  返回:分页列表 + 总数

PATCH /api/admin/inquiries/:id
  权限:STAFF
  请求体:{ status: InquiryStatus, communitySlug?: string, communityName?: string }
  用途:状态流转 + 为"待推荐"分配社区

GET /api/admin/inquiries/export
  权限:STAFF
  返回:CSV 文件
  字段:name, contact, communityName, city, introduction, stage, wantCard, wantVerify,
        bpUrl, status, source, createdAt, userId
```

### 8.5 BP 签名下载

```
GET /api/admin/inquiries/:id/bp
  权限:STAFF
  返回:302 重定向到 R2 签名 URL(有效期 1 小时)
```

---

## 九、后台管理

### Inquiry 看板 `/admin/inquiries`(P0)

**列表字段(直接展示):**

| 列 | 来源 | 说明 |
|----|------|------|
| 称呼 | name | |
| 联系方式 | contact | 直接展示 |
| 意向社区 | communityName | "待推荐"标橙色 |
| 城市 | city | |
| 方向 | introduction | |
| 阶段 | stage | |
| BP | bpUrl | 有则显示"下载"链接 |
| 状态 | status | 可点击切换 |
| 提交时间 | createdAt | |

**功能:**
- 状态流转:PENDING → CONTACTED → DONE / CANCELLED
- 筛选:按状态、城市、社区、时间
- 导出:CSV
- BP 下载:签名 URL
- "待推荐"处理:点击后弹窗选择社区分配

### 认证审核 `/admin/verify`(P2)

| 功能 | 说明 |
|------|------|
| 待审核列表 | wantVerify=true 且 verified=false |
| 审核操作 | 通过 / 拒绝 |
| 已认证列表 | verified=true |

---

## 十、技术约束

| 约束 | 说明 |
|------|------|
| 框架 | Next.js 14 App Router |
| 样式 | TailwindCSS + shadcn/ui |
| 数据库 | PostgreSQL + Prisma |
| 部署 | EdgeOne Pages |
| 目录结构 | 无 src/ 目录 |
| 渲染策略 | ISR + API Route |
| 认证 | NextAuth.js v5,直通车需登录 |
| 文件存储 | R2 私有路径,签名 URL 访问 |
| BP 限制 | 30MB,PDF/DOC/DOCX |
| SEO | 直通车 noindex;社区详情/卡片详情 OG meta |
| **设计系统** | **DESIGN.md(项目根目录)为唯一视觉规范** |

---

## 十一、设计系统迁移

### 11.1 概述

本次改版同步引入统一设计系统(`/DESIGN.md`),替代现有零散的样式定义。设计系统定义了颜色、字体、圆角、间距、组件的完整 token 体系。

**迁移策略:渐进式(策略 B)**
- P0 改造/新建的页面按 DESIGN.md 规范开发
- 旧页面(radar、tools、news 等)暂不改动,P1/P2 逐步统一
- 过渡期允许新旧页面之间有轻微视觉差异

### 11.2 Token 迁移(P0 前置任务)

更新 `tailwind.config.ts`,将 DESIGN.md 的 token 写入 Tailwind 配置:

| 类型 | 改动 |
|------|------|
| 颜色 | 新增 surface-soft/surface-card/ink/body/mute/ash/hairline 等语义色;新增 badge 状态色 4 组 |
| 字体 | 统一 Inter + PingFang SC,确认 font-family 优先级 |
| 圆角 | 统一为 sm(8px) / md(16px) / lg(32px) / full(9999px) |
| 间距 | 新增 section(64px),其余使用 Tailwind 默认值 |
| 背景色 | `#F9FAFB` → `#fbfbf9`(统一到 DESIGN.md) |

### 11.3 组件映射

以下 DESIGN.md 组件对应 PRD 中的具体 UI 元素:

| DESIGN.md 组件 | 对应页面/元素 | 阶段 |
|----------------|-------------|------|
| `community-card` | 社区列表卡片 | P0 |
| `contact-blurred` / `unlock-prompt` | 社区详情页联系方式模糊化 | P0 |
| `floating-cta` | 手机端底部悬浮直通车按钮 | P0 |
| `connect-form-card` / `text-input` / `checkbox` | 直通车表单 | P0 |
| `connect-step-indicator` | 直通车两步指示器 | P0 |
| `contact-reveal-block` | 直通车成功页联系方式展示 | P0 |
| `admin-table` / `status-badge-*` | 后台 Inquiry 看板 | P0 |
| `button-primary` / `button-secondary` | 全局按钮 | P0 |
| `primary-nav` / `nav-tab-*` | 导航栏 | P0 |
| `search-bar` | 社区搜索 | P0 |
| `creator-card` / `verified-badge` | 创业者广场卡片 | P1 |
| `filter-chip` / `filter-chip-active` | 广场筛选标签 | P1 |
| `feature-card` / `feature-card-soft` | 首页价值卡片 | P1 |
| `modal-card` / `modal-scrim` | 登录弹窗 | P1 |
| `contact-gate`(新建) | 社区详情页三态联系方式门控 | P0 |

### 11.4 设计原则(开发时遵循)

1. **OPC Orange 稀缺** - 每个可视区域最多一个橙色 CTA
2. **三圆角系统** - 16px / 32px / pill,不引入新值
3. **无装饰阴影** - 除弹窗遮罩和悬浮 CTA 外不用 box-shadow
4. **内容优先** - 设计不与社区信息竞争注意力
5. **新增组件前先问** - 能用现有 card + md 圆角 + 奶油色表达则不加新 token

### 11.5 不迁移的部分

以下页面在 P0/P1 阶段保持现有样式:
- OPC 雷达(`/radar`、`/radar/[issueNo]`)
- 工具导航(`/tools`)
- 创业资讯列表(`/news`)- 仅 P1 加底部 CTA 时局部调整

---

## 十二、不做的事

- ❌ AI 对话/顾问
- ❌ 独立入驻攻略板块
- ❌ 城市对比页
- ❌ 独立媒体/认证申请页
- ❌ 工具导航大改
- ❌ 私信系统改造
- ❌ 通知系统(P2)
- ❌ 联系方式 per-社区解锁(改为全局解锁)
- ❌ 未登录提交直通车(必须登录)

---

## 十三、开发优先级

### P0(跑通核心转化链路)

**目标:** 社区详情页 → 登录 → 直通车 → 留资 → 解锁联系方式 → 后台跟进

| # | 任务 | 详情 |
|---|------|------|
| 0 | **Token 迁移** | **更新 tailwind.config.ts + 安装缺失 shadcn/ui 组件(select, checkbox, form, dialog, sheet)** |
| 1 | Inquiry 模型 | schema(含 communityName 快照)+ db:push |
| 2 | User 模型更新 | 新增 showInPlaza 字段 + Inquiry 关联 |
| 3 | 直通车 API | POST /api/inquiries(接收 communitySlug)、GET /api/user/unlock-status |
| 4 | ContactGate 组件 | 新建三态门控组件(未登录/已登录未解锁/已解锁),替代社区详情页现有 LoginGate |
| 5 | 社区详情页改造 | 联系方式三层展示 + 直通车按钮 + 手机端悬浮按钮 + 无联系方式特殊处理 |
| 6 | 直通车页面 `/connect/[slug]` | 两步表单 + 自动填充 + 成功页 + 重复检查 + noindex(BP 上传灰态) |
| 7 | 后台 Inquiry 看板 | 列表 + 状态流转 + 筛选 + CSV 导出 + "待推荐"分配 |
| 8 | 入驻细节差异化 | 未登录隐藏 + 评价限制 |
| 9 | 清理残留 | 删除 middleware 中 /market/new、清理 components/market/ |

### P1(广场重构 + 完整体验)

| # | 任务 | 详情 |
|---|------|------|
| 10 | 注册流程微调 | skills 前端清理（注册流程保持现状，回跳/忘记密码已实现） |
| 11 | 通用直通车 `/connect` | 社区下拉(Combobox)+ “帮我推荐” |
| 12 | 个人设置改造 `/settings` | 新增「创业者卡片」区块: showInPlaza 开关 + Project 管理 + 完善度 |
| 13 | 创业者广场重构 | 卡片墙 + 动态 Tab + 筛选 |
| 14 | 卡片详情页改造 | 完整信息 + OG meta + 私信 |
| 15 | 首页重写 | Hero + 价值卡片 + 探索引导 + 卡片预览 |
| 16 | 资讯页 CTA | 底部加直通车入口 |
| 17 | 重复 Inquiry 前端提示 | 409 状态码 → 友好提示 |
| 18 | R2 基础设施 + BP 上传 | 新增 lib/r2.ts + 安装 @aws-sdk/client-s3 + 直通车 BP 上传启用 + 后台 BP 签名下载 |
| 19 | 后台简单统计 | 今日新增 + 状态分布 + 热门社区 Top 5 |

### P2(体验优化 + 生态扩展)

| # | 任务 | 详情 |
|---|------|------|
| 20 | 认证体系 | 后台审核 + badge + 卡片置顶 |
| 21 | 导航重组 | 精简 + 降级 |
| 22 | 旧页面清理 | /start→/ |
| 22 | 通知机制 | 卡片被查看/被联系 |
| 23 | 社区运营方入口 | 联系 → 认领/纠错 |
| 24 | 社区收录申请 | 功能化 |

---

## 十四、验收标准

### P0 完成时应该能做到:
1. 社区详情页联系方式分三层展示(未登录模糊 / 已登录未解锁模糊 / 已解锁可见)
2. 手机端有底部悬浮直通车按钮
3. 未登录点直通车 → 弹登录框 → 登录后进入直通车
4. 直通车两步填写 → 提交成功 → 成功页显示联系方式(如有)+ 小助手微信
5. 提交后全局解锁,返回任意社区详情页联系方式可见
6. 同社区重复提交有提示
7. 后台看板列表直接展示联系方式、可流转状态、可下载 BP、可导出 CSV
8. 社区无联系方式时有特殊文案处理

### P1 完成时应该能做到:
1. 注册精简为 4 字段,skills 消失
2. 通用直通车支持"帮我推荐"
3. 用户可编辑卡片、管理项目、控制广场展示
4. 广场展示卡片墙(含种子数据),支持筛选
5. 首页引导清晰
6. 资讯底部有 CTA
7. 后台有基础统计

### P2 完成时应该能做到:
1. 认证运转
2. 导航清晰
3. 通知机制
4. 社区运营方有入口

---

## 十五、冷启动运营策略

| 动作 | 时机 | 说明 |
|------|------|------|
| 伪造 20-30 张种子卡片 | P1 广场上线前 | 覆盖不同城市/方向/阶段 |
| 社会证明文案 | 卡片 30+ 后 | 直通车勾选框旁「已有 XX 位创业者展示中」|
| 广场独立推广 | 卡片 50+ 后 | 首页/文章引导 |

---

## 附录 A:全量推演修正清单(22 项 + 审查修正 18 项)

| # | 修正 | 体现位置 |
|---|------|---------|
| 1 | 联系方式三层权限(未登录/已登录未解锁/已解锁) | 三 |
| 2 | 直通车必须登录 | 二、5.4 |
| 3 | 提交一次解锁全部社区联系方式 | 三 |
| 4 | 通用直通车 P1(P0 只做指定社区) | 四、十二 |
| 5 | 信任文案 + 成功页展示联系方式 | 5.4 |
| 6 | 小助手微信即时触点 | 5.4 |
| 7 | 手机端底部悬浮按钮 | 5.3、六 |
| 8 | 首页探索引导 | 5.1 |
| 9 | "展示我的项目"行为明确 | 5.1 |
| 10 | 资讯页底部 CTA | 5.10 |
| 11 | 注册后回跳 | 5.9 |
| 12 | 卡片下架开关 | 5.8 |
| 13 | 联系TA 走私信 | 5.6、5.7 |
| 14 | 后台直接展示联系方式 | 九 |
| 15 | BP 私有路径 + 签名 URL | 八、九 |
| 16 | 直通车 noindex | 5.4 |
| 17 | communityName 快照 | 七 |
| 18 | BP 30MB + PDF/DOC/DOCX | 八 |
| 19 | 种子卡片冷启动 | 十四 |
| 20 | footer 社区运营方入口 | 5.1 |
| 21 | 社区列表"提交收录" | 5.2 |
| 22 | OG meta | 5.7 |
| 23 | skills 废弃 | 二、5.9、七 |
| 24 | 两条独立的卡片创建路径 | 二、5.8 |
| 25 | showInPlaza 字段 | 七 |
| 26 | 社区无联系方式特殊处理 | 5.3、5.4 |
| 27 | 城市下拉 Combobox + 全国城市 | 5.4 |
| 28 | lookingFor/canOffer 预设选项 | 5.8 |
| 29 | API 接口完整定义 | 八 |
| 30 | "帮我推荐"后台处理流程 | 5.5、九 |
| 31 | CSV 导出字段定义 | 八 |
| 32 | 发布按钮无卡片引导 → /settings | 5.6 |
| 33 | 后台统计面板(P1) | 十二 |

---

## 附录 B:现有可复用资产

| 资产 | 用途 |
|------|------|
| 183 个社区数据 | 社区页 + Inquiry 关联 + 直通车下拉 |
| 109 条政策数据 | 社区详情页侧边栏 |
| User 字段(mainTrack/stage/canOffer/lookingFor) | 卡片数据 |
| Project 模型(含 ContentType) | 卡片关联项目 |
| Post 模型(含 PostType) | 广场动态 |
| 私信系统 | "联系TA" |
| shadcn/ui | 全部复用 |
| Cloudflare R2 | BP 存储 |
| NextAuth.js v5 | 登录 + redirect |
