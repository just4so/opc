## Why

现有后台管理有骨架但功能不完整（缺编辑/删除/筛选等关键操作），且权限只区分 ADMIN，无法让同事以 MODERATOR 角色协助日常内容维护。需要全面补全后台功能并建立清晰的双角色权限体系。

## What Changes

- **权限体系升级**：ADMIN 拥有所有权限（含角色管理），MODERATOR 可做所有内容操作但不能修改用户角色，后台 layout 和 API 按此规则调整
- **社区管理增强**：列表页加状态筛选、编辑跳转按钮、状态快捷切换（ACTIVE↔INACTIVE）
- **资讯管理补全**：新增编辑页（/admin/news/[id]/edit）、列表加编辑和删除按钮、对应 PUT/DELETE API
- **帖子管理补全**：加置顶切换、删除按钮、搜索框、对应 PATCH/DELETE API
- **合作广场管理（新建）**：新建 /admin/market 页面，含列表展示、状态筛选、下架/恢复/删除操作、对应 API
- **用户管理增强**：角色修改按钮仅 ADMIN 可见、用户详情页展示更多信息
- **后台 layout 升级**：侧边栏加合作管理菜单项、当前页高亮、菜单可见性按角色区分

## Capabilities

### New Capabilities
- `admin-permissions`: 双角色权限体系（ADMIN/MODERATOR），API 权限校验和 UI 按钮可见性控制
- `admin-communities`: 社区管理增强 — 状态筛选、编辑跳转、状态快捷切换
- `admin-news`: 资讯管理补全 — 编辑页、删除功能、PUT/DELETE API
- `admin-posts`: 帖子管理补全 — 置顶切换、删除、搜索、PATCH/DELETE API
- `admin-market`: 合作广场后台管理（全新模块）— 列表、筛选、下架/恢复/删除
- `admin-users`: 用户管理增强 — 角色修改权限控制、详情页信息扩展
- `admin-layout`: 后台 layout 升级 — 侧边栏菜单项、角色可见性、当前页高亮

### Modified Capabilities

_(无现有 spec 需要修改)_

## Impact

- **API 路由**：新增/修改 /api/admin/news/[id]、/api/admin/posts/[id]、/api/admin/market、/api/admin/market/[id]
- **页面**：新增 /admin/news/[id]/edit、/admin/market；修改 /admin/communities、/admin/news、/admin/posts、/admin/users、/admin/users/[id]
- **权限层**：lib/admin.ts 的 requireStaff/requireAdmin 保持不变，各 API 按需调用；前端通过 session.user.role 控制按钮可见性
- **Layout**：app/admin/layout.tsx 侧边栏菜单和权限判断调整
- **不改 Prisma schema**：不新增字段，避免 migration 复杂度
