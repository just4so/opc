## Context

现有后台管理（/admin）已有较完整的骨架，经代码审查发现：

**已存在的功能（用户描述中认为缺失但实际存在的）：**
- 帖子管理：置顶切换、隐藏/显示、删除、搜索、状态筛选 — 均已实现
- 社区管理：状态筛选、搜索 — 已实现
- 合作广场管理：已存在于 /admin/orders（命名为"订单管理"），含搜索、类型筛选、状态筛选、置顶、隐藏/显示、删除、CSV导出，且已使用 isStaff 权限
- 资讯管理：删除、切换原创标记、编辑作者 — 已实现

**实际需要新增/修改的：**
1. 权限体系：社区管理和资讯管理从 adminOnly 改为 staff 可访问
2. 社区列表：加「编辑」按钮直接跳转编辑页、加状态快捷切换
3. 资讯管理：新建完整编辑页（/admin/news/[id]/edit），PUT API 支持全字段编辑
4. 用户管理：角色修改按钮仅 ADMIN 可见、详情页信息扩展
5. 后台 layout：侧边栏当前页高亮、菜单可见性按角色调整

**约束条件：**
- 不改 Prisma schema
- TypeScript 零错误
- 复用现有 shadcn/ui 组件
- 操作后列表自动刷新

## Goals / Non-Goals

**Goals:**
- 将社区管理、资讯管理的权限从 ADMIN-only 降级为 MODERATOR 也可访问
- 社区列表增加编辑跳转和状态快捷切换
- 资讯管理补全编辑页（复用新建页表单）和对应 PUT API
- 用户管理的角色修改按钮仅 ADMIN 可见
- 用户详情页展示更多信息（注册时间、帖子数、业务方向等）
- 后台侧边栏当前页高亮

**Non-Goals:**
- 不新增 /admin/market 页面（已存在于 /admin/orders，功能完整）
- 不改 Prisma schema
- 不实现封禁功能（schema 无 banned 字段，改用角色降级已够用）
- 不重构帖子管理（功能已完整）

## Decisions

### Decision 1: 复用 /admin/orders 而非新建 /admin/market

**选择**：保持现有 /admin/orders 路由和 API 不变，仅在侧边栏将显示名称从"订单管理"改为"合作管理"。

**理由**：/admin/orders 已完整实现了合作广场管理所需的全部功能（搜索、筛选、置顶、隐藏、删除、导出），且已使用 isStaff 权限。新建 /admin/market 会造成功能重复。

**替代方案**：新建 /admin/market 并迁移 — 改动大、风险高、无功能收益。

### Decision 2: 权限控制通过 API 层 + 前端 UI 双重保障

**选择**：API 层使用 requireStaff/requireAdmin 校验；前端通过 session.user.role 控制按钮/菜单可见性。

**理由**：已有 requireStaff/requireAdmin 函数完善且已在各处使用，只需调整少数 API 从 isAdmin 改为 isStaff。

### Decision 3: 资讯编辑页复用新建页表单

**选择**：新建 /admin/news/[id]/edit/page.tsx，提取新建页的表单为共享组件（或直接在编辑页复制简化版表单），通过 PUT API 更新。

**理由**：新建和编辑的字段完全一致（标题、分类、作者、内容、发布日期），复用减少重复代码。

### Decision 4: 侧边栏高亮使用 usePathname

**选择**：在 layout.tsx 中使用 Next.js 的 usePathname hook 比对当前路径，为匹配的菜单项添加高亮样式。

**理由**：标准 Next.js 模式，无需额外依赖。

## Risks / Trade-offs

- **[权限降级风险]** 社区/资讯管理开放给 MODERATOR → 通过 ADMIN 严格控制谁能被设为 MODERATOR 来缓解
- **[已有功能误判]** 用户描述中部分功能已存在 → 通过详细代码审查确认，避免重复开发
- **[编辑页数据一致性]** 资讯编辑时可能覆盖并发修改 → 当前单人运营场景下风险极低，暂不加乐观锁
