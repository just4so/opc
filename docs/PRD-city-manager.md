# PRD：城市主理人系统 + 操作日志

> 版本：v1.0（2026-06-12）
> 状态：待确认
> 关联背景：城市主理人招募完成，需要在网站上完成「对外展示 + 对内赋权 + 操作留痕」三件事

---

## 一、背景与目标

OPC圈城市主理人计划已完成首批招募（每城一人，排他制）。需要：

1. **对外**：重构 `/about` 页面，把「平台介绍」和「城市主理人展示」整合成一个有公信力的品牌页，给主理人正式的官方背书
2. **对内**：给主理人开放受限后台权限，让他们管理自己城市的社区、意向用户、政策数据
3. **留痕**：多角色操作后台后，所有变更必须可追溯（操作日志）

**不做的事（明确排除）：**
- 认证管理不开放给主理人
- 不做主理人之间的协作功能
- 不做主理人收益/分润系统（未来再说）

---

## 二、角色与权限模型

### 2.1 角色定义

| 角色 | UserRole | 权限范围 |
|------|----------|---------|
| 管理员 | `ADMIN` | 全部板块，全部城市，可管理主理人 |
| 版主 | `MODERATOR` | 全部板块，全部城市（现状保持不变） |
| **城市主理人** | `CITY_MANAGER`（新增） | 受限板块 × 管辖城市范围 |
| 普通用户 | `USER` | 无后台权限 |

> UserRole enum 新增 `CITY_MANAGER` 值（PostgreSQL 加 enum 值是安全的增量操作）。

### 2.2 主理人权限矩阵

| 后台板块 | 主理人权限 | 说明 |
|---------|-----------|------|
| 仪表盘 | ✅ 只读 | 只显示管辖城市的统计数据 |
| 社区管理 | ✅ 查看 + 编辑 + 新增 | 仅管辖城市；新增社区直接上线（不设审核，靠操作日志追溯）；**不可删除** |
| 意向管理 | ✅ 查看 + 处理 | 仅管辖城市；可改状态、写备注 |
| 政策管理 | ✅ 查看 + 新增 + 编辑 | 仅管辖省/城市；不可删除 |
| 认证管理 | ❌ | 不开放 |
| 用户管理 | ❌ | 不开放 |
| 内容管理（posts/news/radar/orders/settings） | ❌ | 不开放 |
| 操作日志 | ✅ 只读（仅自己的） | ADMIN 可看所有人的 |

### 2.3 城市范围（scope）

- 主理人管辖范围支持两级：**地级市**（如"武汉"）或 **省份**（如"湖北省"）
- 省级主理人能看到该省所有城市的数据
- **实现方式**：代码内置静态省市映射表 `lib/china-regions.ts`（省 → 城市列表），查询时将省翻译为城市列表做 `city IN (...)` 过滤。不修改 Community/Inquiry 表结构，不回填数据
- 一个主理人只绑定一个范围（一城或一省）；未来如需一人多城，扩展为多条 CityManager 记录

---

## 三、数据模型

### 3.1 新表：CityManager（主理人档案）

```prisma
model CityManager {
  id          String            @id @default(cuid())
  userId      String?           @unique          // 关联用户账号；可空（仅展示、暂无账号的主理人）
  name        String                             // 展示姓名
  avatar      String?                            // 形象照（R2 存储）
  title       String?                            // 头衔，如「武汉主理人 · AI产品创业者」
  bio         String?                            // 个人简介
  quote       String?                            // 个人宣言/金句（前台卡片引用展示）
  focusTags   String[]          @default([])     // 关注领域标签，如 ["AI落地", "跨境电商"]
  wechat      String?                            // 微信号（前台展示用）
  scope       ManagerScope      @default(CITY)   // CITY | PROVINCE
  city        String?                            // scope=CITY 时必填，如「武汉」
  province    String                             // 所属省份（两种 scope 都填，用于分组展示）
  order       Int               @default(0)      // 前台排序权重，越大越靠前
  status      ManagerStatus     @default(ACTIVE) // ACTIVE | INACTIVE
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  user        User?             @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([status, order])
  @@index([city])
  @@index([province])
}

enum ManagerScope {
  CITY
  PROVINCE
}

enum ManagerStatus {
  ACTIVE
  INACTIVE
}
```

**设计要点：**
- `userId` 可空：先录入展示信息，主理人注册账号后再绑定，绑定后才有后台权限
- `status=INACTIVE`：前台立即隐藏 + 后台权限立即失效，但记录保留（不物理删除）
- 解绑/停用不影响用户账号本身

### 3.2 新表：AuditLog（操作日志）

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String                              // 操作人
  userName   String                              // 冗余操作人名称（防用户改名/删除后无法显示）
  userRole   String                              // 操作时的角色快照
  action     String                              // CREATE | UPDATE | DELETE | STATUS_CHANGE | APPROVE | REJECT
  targetType String                              // COMMUNITY | INQUIRY | POLICY | CITY_MANAGER | USER | ...
  targetId   String                              // 操作对象 ID
  targetName String                              // 冗余对象可读名称
  changes    Json?                               // 关键字段变更 { field: { from, to } }，只记有变化的字段
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

**设计要点：**
- 手动埋点（API 路由内操作成功后写入），不做全局中间件——只记真正成功的操作，精确可控
- `changes` 只记录发生变化的关键字段 before/after，不做全量快照
- 日志只增不删（ADMIN 也不提供删除入口）
- 不索引 IP/UA（当前规模不需要，留扩展余地）

### 3.3 User 表变更

```prisma
// User model 新增关系
cityManagerProfile CityManager?
```

UserRole enum 新增 `CITY_MANAGER`。

---

## 四、前台：/about 页面重构

### 4.1 整体结构（参考 前端参考.html 的编辑部风格）

风格基调：大字号 display 标题、留白充足、橙色主色（沿用站内 primary）、深色主理人展示区形成视觉对比。**参考其样式语言，内容和文案按下方设计，不照搬英文内容。**

```
┌─ Section 1: Brand Hero ─────────────────────┐
│  大字号标题（中文，待定文案，如「连接信任」）  │
│  平台一句话定位 + Est. 2025                  │
├─ Section 2: 我们是谁 / 我们做什么 ───────────┤
│  现有 about 内容重新排版：                   │
│  - 平台介绍叙述卡片                          │
│  - 四个功能卡片（社区信息/直通车/广场/雷达）  │
├─ Section 3: 城市主理人（深色区块）★核心新增 ─┤
│  标题：「一城一人」/ NATIONAL NODES 风格     │
│  副标题：每个城市只有一位主理人               │
│  Bento Grid 卡片布局：                       │
│  - 前 2 位：大卡（照片半幅 + 简介 + 金句）    │
│  - 其余：小卡（圆形头像 + 城市标签 + 简介）   │
│  卡片内容：形象照/姓名/城市标签/头衔/         │
│           金句/领域标签/联系按钮             │
├─ Section 4: 成为主理人 CTA ──────────────────┤
│  「成为下一个城市主理人」+ 申请按钮          │
├─ Section 5: 联系我们 ────────────────────────┤
│  现有联系方式保留                            │
└──────────────────────────────────────────────┘
```

### 4.1.1 Hero 区文案（v1 初稿，可随时改）

- 主标题（两行，第二行橙色斜体强调）：
  - 第一行：`一城一人，`
  - 第二行：`连接信任。`
- 副文案：`OPC圈是中国一人公司创业者的信息与连接平台。我们人工核实每一条社区信息，在每座城市寻找一位值得信任的主理人——因为信息可以很多，但信任永远稀缺。`
- 标记：`EST. 2025 · 北京数据胶囊科技`
- 主理人区（深色 Section）标题：`城市主理人` / 副标题：`每座城市，只有一位。`
- CTA 区标题：`成为下一座城市的主理人`

### 4.2 数据与行为

- Section 3 数据来源：`CityManager WHERE status=ACTIVE ORDER BY order DESC, createdAt ASC`
- **0 个 ACTIVE 主理人时整个 Section 3 + 4 隐藏**（不出现空区块）
- 卡片布局自适应数量：1-2 个全大卡，3 个以上「2 大 + N 小」
- 联系按钮交互：点击弹出弹层显示微信号（一键复制）；无微信号则不显示按钮。微信号在后台主理人表单中维护（见 5.1），改后台即时生效
- 申请按钮交互：mailto 链接到 cooperation@opcquan.com（标题预填「申请城市主理人 + 城市名」）
- SEO：页面 metadata 更新，主理人姓名+城市进入页面文本（利于「城市 OPC」长尾词）
- 服务端渲染（Server Component），revalidate 适当放宽（如 3600s），后台变更主理人时主动 revalidatePath('/about')

---

## 五、后台功能

### 5.1 主理人管理（ADMIN 专属）

路由：`/admin/managers`（侧边栏「用户与权限 → 主理人管理」）

- 列表：头像、姓名、范围（城市/省）、绑定账号、状态、排序、更新时间；支持按状态/省份筛选
- **新增/编辑表单（主理人对外展示信息的唯一编辑入口）**，包含全部字段：
  - 展示信息：姓名、形象照（R2 上传）、头衔、个人简介、金句 quote、领域标签、微信号
  - 管辖范围：scope（城市/省）+ 对应城市或省份
  - 控制字段：排序权重、状态（ACTIVE/INACTIVE）
  - 保存后自动 revalidatePath('/about')，前台即时生效
- 绑定账号：输入用户名/邮箱搜索现有用户进行绑定；**绑定时自动将该用户 role 升级为 CITY_MANAGER，解绑/停用时自动降回 USER**（若该用户是 ADMIN/MODERATOR 则不动 role，仅解绑）
- 状态切换：ACTIVE ⇄ INACTIVE 一键切换，切换后 revalidatePath('/about')
- 不提供物理删除（保留 INACTIVE 记录；如确需删除仅 ADMIN 可操作并写日志）

### 5.1.1 后台信息架构（侧边栏重组，全角色受益）

> 背景：板块增多后必须保持后台清晰。侧边栏从平铺列表改为分组结构：

```
仪表盘
─ 数据管理 ───────
  社区管理
  意向管理
  政策管理
─ 内容管理 ───────
  动态管理 (posts)
  资讯管理 (news)
  雷达管理 (radar)
─ 用户与权限 ─────
  用户管理
  认证管理
  主理人管理        ← 新增
  社区认领 (claims)
─ 系统 ──────────
  订单管理
  操作日志          ← 新增
  站点设置
```

- ADMIN/MODERATOR 看到全部分组；CITY_MANAGER 只看到：仪表盘 + 数据管理组（3项）+ 操作日志（自己的）
- 仅调整侧边栏组织和视觉分组，不改任何现有页面路由

### 5.2 主理人登录后的后台体验

复用现有 `/admin` 框架，不另建一套后台：

- **侧边栏按角色渲染**：CITY_MANAGER 只看到 → 仪表盘 / 社区管理 / 意向管理 / 政策管理 / 操作日志（自己的）
- **页面标题区显示管辖范围**：如「当前管辖：武汉」，让主理人清楚自己的数据边界
- **仪表盘**：只显示管辖城市的统计（社区数、待处理意向数、近期动态）
- 直接访问无权限路由（如 /admin/users）→ redirect 到 /admin

### 5.3 权限层改造（lib/admin.ts）

新增统一的权限上下文函数，替代散落的判断：

```typescript
type StaffContext = {
  id: string
  role: UserRole
  username: string
  name: string | null
  // CITY_MANAGER 专属：管辖城市列表（省级已展开为城市数组）；ADMIN/MODERATOR 为 null（不限制）
  managedCities: string[] | null
  managerScope: { scope: 'CITY' | 'PROVINCE', city?: string, province: string } | null
}

// 新增
async function requireStaffContext(): Promise<StaffContext>        // 页面版
async function requireStaffContextApi(): Promise<StaffContext | NextResponse>  // API 版
function cityFilter(ctx: StaffContext): Prisma.WhereInput          // 生成 city IN (...) 过滤条件
```

- CITY_MANAGER 登录时通过 `CityManager` 表（status=ACTIVE）解析管辖范围；省级 scope 用 `lib/china-regions.ts` 映射展开为城市列表
- INACTIVE 的主理人 → 等同无后台权限
- 现有 `requireStaff` / `requireStaffApi` 保持兼容（ADMIN/MODERATOR 路径行为不变）

### 5.4 需要改造的 API 路由清单

| 路由 | 改造内容 |
|------|---------|
| `GET/POST /api/admin/communities` | 接入 cityFilter；CITY_MANAGER 新增的社区 city 强制为管辖范围内 |
| `GET/PUT/DELETE /api/admin/communities/[id]` | 越权检查（目标社区 city 必须在管辖范围）；DELETE 拒绝 CITY_MANAGER |
| `GET /api/admin/inquiries`、`PUT /api/admin/inquiries/[id]` | cityFilter + 越权检查 |
| `GET/POST /api/admin/policies`、`PUT/DELETE /api/admin/policies/[id]` | 省/市过滤 + 越权检查；DELETE 拒绝 CITY_MANAGER |
| `GET /api/admin/dashboard` | CITY_MANAGER 返回管辖城市统计 |
| 其余 admin 路由 | 保持 requireStaffApi（ADMIN/MODERATOR），CITY_MANAGER 访问返回 403 |
| 新增 `/api/admin/managers` + `[id]` | 主理人 CRUD（requireAdminApi） |
| 新增 `/api/admin/logs` | 日志查询（ADMIN 看全部，CITY_MANAGER 看自己） |

> 关键安全原则：**过滤在服务端 where 条件里做，越权检查在单条操作前做**。前端隐藏入口只是体验，不是安全边界。

### 5.5 操作日志

**埋点范围（M2 一次性埋全）：**

| targetType | 埋点动作 |
|-----------|---------|
| COMMUNITY | 创建、编辑（记 changes）、状态变更、删除 |
| INQUIRY | 状态变更、备注修改 |
| POLICY | 创建、编辑、状态变更、删除 |
| CITY_MANAGER | 创建、编辑、状态切换、绑定/解绑账号 |
| USER | 角色变更、认证操作（ADMIN 行为也记） |

**查看页面**：`/admin/logs`（侧边栏「操作日志」）
- 列表：时间、操作人（角色徽章）、动作、对象类型+名称（链接到对象）、变更摘要
- 筛选：操作人 / targetType / action / 时间范围
- changes 字段点击展开显示 before → after
- 分页，默认按时间倒序

---

## 六、Milestone 划分与验收标准

### M1：数据基建 + 前台展示（先让主理人「亮相」）

**范围：**
1. Prisma migration：CityManager 表 + AuditLog 表 + UserRole 加 CITY_MANAGER + User 关系
2. `/admin/managers` 主理人管理 CRUD（含形象照 R2 上传、账号绑定、状态切换）
3. `/about` 页面重构（全部 5 个 Section）
4. `lib/china-regions.ts` 省市映射表
5. CITY_MANAGER 相关埋点（主理人管理操作写 AuditLog——表已建，先埋这一处）

**验收：**
- [ ] 后台添加一个主理人（传形象照、填金句和标签）→ /about 立即可见，样式符合参考风格
- [ ] 停用主理人 → /about 立即消失
- [ ] 0 主理人时 /about 不出现空区块
- [ ] 移动端布局正常
- [ ] build 通过 + 现有页面无回归

### M2：权限系统 + 日志埋点（让主理人「干活」）

**范围：**
1. lib/admin.ts 权限上下文改造（requireStaffContext + cityFilter）
2. 5.4 清单中全部 API 路由改造
3. admin 侧边栏分组重构（5.1.1）+ 按角色渲染 + 管辖范围显示
4. 仪表盘城市过滤版
5. 全部操作日志埋点（5.5 清单）

**验收：**
- [ ] 测试主理人账号（绑定「武汉」）登录后台：只看到 4 个板块，社区/意向/政策列表只有武汉数据
- [ ] 用该账号直接请求 API 操作上海的社区 → 403
- [ ] 主理人新增社区 → city 锁定在管辖范围内，操作写入日志
- [ ] 省级主理人（如「湖北省」）能看到武汉+宜昌+襄阳的数据
- [ ] 主理人的每个写操作都产生日志记录
- [ ] ADMIN 体验无任何变化

### M3：日志查看页 + 收尾

**范围：**
1. `/admin/logs` 日志查看页（筛选 + changes 展开）
2. 主理人只读自己日志的入口
3. 根据 M1/M2 实际使用反馈的修补

**验收：**
- [ ] ADMIN 可按人/类型/时间筛选所有日志
- [ ] 主理人只能看到自己的操作记录
- [ ] changes 展开显示字段级 before/after

---

## 七、技术约束（给 Claude Code 的硬性要求）

1. **不重复造轮子**：复用现有 admin 框架、R2 上传通道、requireStaff 体系（扩展而非重写）、现有 UI 组件
2. **不破坏现状**：ADMIN/MODERATOR 的现有行为一字不改；现有页面零回归
3. **安全边界在服务端**：所有过滤和越权检查在 API 层完成，前端只做展示控制
4. **migration 一次完成**：M1 把两张表 + enum 全部建好，M2/M3 不再动表结构
5. **本地验证后再 push**：dev server 跑通核心流程，build 通过
6. 遵循项目 CLAUDE.md 现有规范

---

## 八、已确认决策（2026-06-12 与阿良哥确认）

| # | 问题 | 决策 |
|---|------|------|
| 1 | 主理人新增社区是否审核 | **不审核，直接上线**（靠操作日志追溯，降低实现复杂度） |
| 2 | 「申请成为主理人」交互 | **mailto** 到 cooperation@opcquan.com，标题预填 |
| 3 | 主理人卡片「联系」按钮 | **微信号弹层 + 一键复制**；微信号在后台主理人表单维护 |
| 4 | Hero 中文文案 | 用 4.1.1 的 v1 初稿，上线前可改 |
| 5 | 主理人编辑自己的展示资料 | **不开放，ADMIN 代管**（M3 之后视需求再说） |
| 6 | 后台信息架构 | **侧边栏分组重构**（见 5.1.1），保证功能分类清晰 |

---

## 九、执行方式（防上下文变形，每次派单前重读本节）

1. **派单主体**：闹闹虾通过 ACP（sessions_spawn runtime:"acp"）派给 Claude Code，一次只派一个 Milestone
2. **每次派单 prompt 必须包含**：本 PRD 文件路径 + 对应 Milestone 章节全文 + 项目 CLAUDE.md 约束 + 第七节技术约束 + 验收清单
3. **M2 拆为两次派单**（单次任务过长会变形）：
   - M2a：权限层（requireStaffContext + cityFilter + 路由改造 + 侧边栏）
   - M2b：操作日志全量埋点
4. **每个 Milestone 完成后**（AGENTS.md ACP 收尾清单）：git diff 确认文件 → build 验证 → 本地 dev 跑通验收项 → 截图（涉及 UI 时）→ commit → 更新本节下方进度表 + CLAUDE.md + 日记 → 飞书汇报（含「已对照 PRD 验收」）
5. **M1 的 /about 视觉验收**：截图发阿良哥确认后才算通过，不自说自话
6. **不使用 openspec**：本项目现有流程是 PRD 驱动（docs/PRD-*.md），保持一致

### 进度跟踪

| Milestone | 状态 | commit | 备注 |
|-----------|------|--------|------|
| M1 数据建模+前台+主理人管理 | 未开始 | - | - |
| M2a 权限层 | 未开始 | - | - |
| M2b 日志埋点 | 未开始 | - | - |
| M3 日志查看页+收尾 | 未开始 | - | - |
