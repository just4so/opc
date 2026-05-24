# V2 质量审计报告

> 审计时间：2026-05-24
> 范围：feat/v2-redesign 分支相对 main 的全部改动（70+ 文件）
> 方法：静态代码分析 + 模式扫描

---

## 🔴 P0 - 必须修复（Bug / 安全 / 数据问题）

### QA-01: CSV 导出中文乱码
**文件：** `app/api/admin/export/inquiries/route.ts`
**问题：** 缺少 UTF-8 BOM（`\uFEFF`），Excel 打开 CSV 会中文乱码
**修复：** 响应体开头加 `\uFEFF`

### QA-02: 7个 API 缺少 try/catch 错误处理
**文件：**
- `app/api/admin/dashboard/route.ts`
- `app/api/admin/export/inquiries/route.ts`
- `app/api/admin/stats/inquiries/route.ts`
- `app/api/admin/verify/[userId]/route.ts`
- `app/api/admin/verify/route.ts`
- `app/api/plaza/projects/route.ts`
- `app/api/settings/qrcode/route.ts`
**问题：** Prisma 查询失败时会直接抛 500 without body，前端无法显示友好错误信息
**修复：** 统一加 try/catch + return 500 JSON

### QA-03: CARD_CONTACTED 通知从未触发
**文件：** `lib/notifications.ts:52`
**问题：** `createCardContactedNotification` 已定义，但没有任何地方调用它。用户联系别人时不会产生通知
**修复：** 在私信发送或"联系TA"操作处调用

### QA-04: community-claims 公开接口无防滥用
**文件：** `app/api/community-claims/route.ts`
**问题：** POST 无认证、无 rate limit，可被恶意刷量
**修复：** 加 IP 限流（每 IP 每小时最多 5 次）或要求登录

---

## 🟡 P1 - 建议修复（代码质量 / 可维护性）

### QA-05: skills 字段代码残留（3个文件）
**文件：**
- `app/(main)/plaza/new/page.tsx`（state + payload + JSX，3处）
- `app/api/posts/route.ts`（2处）
- `app/api/user/profile/route.ts`（3处）
**问题：** PRD 要求废弃 skills，但发帖页 COLLAB 类型仍收集 skills 标签
**判断：** Post model 有 skills 字段，这是 COLLAB 帖子的"技能需求"功能，不是用户 skills。**保留不删**，但 profile API 的 skills 相关代码应清理
**修复：** 只清理 `app/api/user/profile/route.ts` 中的 skills 引用

### QA-06: ensureUrl 函数重复定义
**文件：** `components/profile/profile-client.tsx:76` + `app/(main)/settings/page.tsx:76`
**问题：** 同一个函数在两个文件中各定义一次
**修复：** 提取到 `lib/utils.ts` 导出复用

### QA-07: 6处 `any` 类型
**位置：**
- `app/api/plaza/projects/route.ts` — `where: any`
- `app/api/admin/verify/route.ts` — `where: any`
- `app/api/user/card/route.ts` — `updateData: Record<string, any>`
- `components/plaza/plaza-client.tsx` — `toISO(d: any)`
- `app/(main)/page.tsx` — `session.user as any`
**修复：** 替换为 Prisma 类型或明确的接口

### QA-08: connect-form.tsx 过大（574行）
**问题：** 表单逻辑、验证、成功页、二维码获取全在一个组件
**建议：** 拆分为 ConnectFormStep1、ConnectFormStep2、ConnectSuccess 三个子组件（Phase 7 视觉改版时一并做）

---

## 🟢 P2 - 已确认正常（无需修复）

| 项目 | 结果 |
|------|------|
| 未使用 import | 未发现 |
| console.log 残留 | 未发现 |
| N+1 查询 | 未发现 |
| 硬编码敏感信息 | 未发现 |
| /start 废弃页面 | 已删除 ✅ |
| Date 序列化 | plaza/profile 均已 toISOString() ✅ |
| R2 上传安全 | 有 Zod 校验 + 文件类型白名单 + 大小限制 ✅ |
| middleware matcher | 与页面路由一致 ✅ |
| Admin API 权限 | 全部有 requireStaff() ✅ |
| 公开 API（qrcode/plaza/projects）| 正确无需认证 ✅ |
| Prisma select 优化 | 均有 select 指定字段 ✅ |

---

## 修复计划

| # | 问题 | 优先级 | 预计 |
|---|------|--------|------|
| QA-01 | CSV BOM | P0 | 1行 |
| QA-02 | 7个API加try/catch | P0 | 70行 |
| QA-03 | CARD_CONTACTED 触发 | P0 | 10行 |
| QA-04 | claims rate limit | P0 | 20行 |
| QA-05 | profile skills 清理 | P1 | 5行 |
| QA-06 | ensureUrl 提取 | P1 | 10行 |
| QA-07 | any 类型替换 | P1 | 20行 |
| QA-08 | connect-form 拆分 | P2 | Phase 7 |

**总计修复量：P0 约 100 行，P1 约 35 行，可在一个 ACP 任务内完成。**
