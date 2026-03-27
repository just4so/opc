## 1. 权限体系调整

- [ ] 1.1 修改 /api/admin/communities/route.ts：GET 从 isAdmin 改为 isStaff
- [ ] 1.2 修改 /api/admin/communities/[id]/route.ts：GET/PATCH/DELETE 从 isAdmin 改为 isStaff
- [ ] 1.3 修改 /api/admin/news/[id]/route.ts：PATCH/DELETE 从 isAdmin 改为 isStaff
- [ ] 1.4 修改 /api/admin/users/[id]/route.ts：PATCH 中角色修改字段单独校验 isAdmin，其他字段保持 isStaff
- [ ] 1.5 修改 app/admin/layout.tsx：社区管理和资讯管理菜单项改为 MODERATOR 也可见

## 2. 后台 Layout 升级

- [ ] 2.1 侧边栏加 usePathname 高亮当前页菜单项
- [ ] 2.2 "订单管理" 标签改为 "合作管理"
- [ ] 2.3 用户管理菜单项改为 MODERATOR 也可见

## 3. 社区管理增强

- [ ] 3.1 社区列表每行加「编辑」按钮，点击跳转 /admin/communities/[id]/edit
- [ ] 3.2 社区列表每行加状态快捷切换按钮（ACTIVE↔INACTIVE），调用 PATCH API 后自动刷新列表

## 4. 资讯管理补全

- [ ] 4.1 新建 /api/admin/news/[id]/route.ts 的 PUT 方法，支持更新 title/category/author/content/publishedAt
- [ ] 4.2 新建 app/admin/news/[id]/edit/page.tsx 编辑页，加载现有数据并复用新建页表单结构
- [ ] 4.3 资讯列表页每行加「编辑」按钮（仅原创文章），跳转 /admin/news/[id]/edit

## 5. 用户管理增强

- [ ] 5.1 用户列表页：角色修改下拉框根据当前用户 role 条件渲染（仅 ADMIN 可见）
- [ ] 5.2 用户详情页 /admin/users/[id]：增加显示 createdAt、mainTrack、startupStage、level、帖子总数

## 6. 验证

- [ ] 6.1 运行 npm run build 确保 TypeScript 零错误
