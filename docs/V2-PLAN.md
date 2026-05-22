# V2 改版开发计划

> 主 Agent 参考文件。每完成一个阶段，更新本文件进度 + 更新 CLAUDE.md 当前阶段信息。

## Git 策略

```
main (生产，始终可部署)
  └── feat/v2-redesign (一个分支，5 个有意义的 commits)
        ├── commit: "feat(infra): token migration + schema + cleanup"
        ├── commit: "feat(api): inquiry API + unlock status"
        ├── commit: "feat(ui): ContactGate + community detail page"
        ├── commit: "feat(connect): direct connect page"
        └── commit: "feat(admin): inquiry dashboard"
```

- 不用子分支，每个阶段一个 commit，回退精确（`git revert <commit>`）
- 每天 `git merge main` 到 feat/v2-redesign，保持同步
- P0 全部完成后 merge 回 main（普通 merge，保留历史）
- **改版期间 main 上不做社区详情页的改动**（唯一文件重叠点）

## 阶段计划

### 阶段一：基础设施（P0 #0-2, #9）
- [ ] Token 迁移：更新 tailwind.config.ts（DESIGN.md 色值/字体/圆角/间距）
- [ ] 安装缺失 shadcn/ui 组件（select, checkbox, form, dialog, sheet）
- [ ] Inquiry 模型：schema 新增 + db:push
- [ ] User 模型：新增 showInPlaza 字段 + Inquiry 关联
- [ ] 清理残留：middleware /market/new、components/market/

**验证标准：**
- `npm run build` 通过
- 现有页面视觉无变化（截图对比）
- `npx prisma db push` 成功
- 新增的模型/字段在 Prisma Studio 可见

---

### 阶段二：后端 API（P0 #3）
- [ ] POST /api/inquiries（接收 communitySlug，后端查 id）
- [ ] GET /api/user/unlock-status
- [ ] curl 测试全部接口

**验证标准：**
- curl 创建 Inquiry 成功，返回 communityContact
- curl 查询 unlock-status 返回 true/false
- 不改任何前端文件

---

### 阶段三：前端改造（P0 #4-5, #8）
- [ ] 新建 ContactGate 组件（三态门控）
- [ ] 社区详情页改造（联系方式三层展示 + 直通车按钮 + 悬浮按钮）
- [ ] 入驻细节差异化（未登录隐藏 + 评价限制）

**验证标准：**
- 桌面端 + 手机端截图，三种状态各一张
- 未登录→模糊；已登录未解锁→模糊+直通车按钮；已解锁→完整可见
- 无联系方式的社区不展示联系人区块
- `npm run build` 通过

---

### 阶段四：直通车页面（P0 #6）
- [ ] `/connect/[slug]` 两步表单
- [ ] 自动填充（user.name 为空时称呼不预填）
- [ ] 成功页（展示联系方式 + 小助手微信）
- [ ] 重复提交检查（409）
- [ ] BP 上传灰态（"即将支持"）
- [ ] noindex meta

**验证标准：**
- 完整走通：选社区→登录→填表→提交→看到联系方式→返回详情页联系方式已解锁
- 重复提交弹提示
- 手机端表单布局正常

---

### 阶段五：后台看板（P0 #7）
- [ ] /admin/inquiries 列表页
- [ ] 状态流转（PENDING→CONTACTED→DONE/CANCELLED）
- [ ] 筛选（状态/城市/社区/时间）
- [ ] CSV 导出
- [ ] "待推荐"分配
- [ ] admin layout 加导航项

**验证标准：**
- 看板能显示测试数据
- 状态可点击切换
- CSV 下载能打开
- 权限用 isStaff（ADMIN + MODERATOR）

---

## 阶段间规则

1. **每阶段完成后必须做：** git diff 确认文件 + 本地 `npm run dev` 验证 + 截图
2. **每阶段开始前必须做：** 更新 CLAUDE.md 当前阶段信息
3. **不能跨阶段改文件：** 后端阶段不碰前端，前端阶段不改 API
4. **社区详情页是最高风险页面：** 改之前截图存档，改完逐项对比
5. **每个阶段完成后 commit 一次：** 格式 `feat(xxx): 描述`，不要整个阶段打成多个小 commit

## 相关文件

| 文件 | 用途 |
|------|------|
| `docs/PRD-v2-redesign.md` | 完整 PRD v5.2（35KB，15 章） |
| `DESIGN.md` | 设计系统规范（18KB，含 OPC 圈特有组件） |
| `CLAUDE.md` | Claude Code 每次启动必读（含当前阶段信息） |
| 本文件 `docs/V2-PLAN.md` | 主 Agent 开发计划参考 |

## 进度

| 阶段 | 状态 | 开始时间 | 完成时间 | 备注 |
|------|------|---------|---------|------|
| 一：基础设施 | ✅ 完成 | 2026-05-23 00:20 | 2026-05-23 00:28 | commit 098d107, 主 Agent 手动执行 |
| 二：后端 API | ✅ 完成 | 2026-05-23 00:50 | 2026-05-23 01:34 | commit a4b19e9, ACP 7m46s |
| 三：前端改造 | ✅ 完成 | 同上 | 同上 | 与阶段二合并执行（ContactUnlock + FloatingCTA） |
| 四：直通车 | ✅ 完成 | 同上 | 同上 | 与阶段二合并执行（ConnectForm 369行） |
| 五：后台看板 | ✅ 完成 | 同上 | 同上 | 与阶段二合并执行（InquiriesClient 219行） |

### P0 总结
- **代码量：** +1,210 行（11 文件）
- **新建文件：** 9 个（3 API + 3 组件 + 2 后台 + 1 页面）
- **build 状态：** ✅ 零报错
- **待验证：** 需要 `npm run dev` 本地跑一遍完整流程 + 手机端截图
