# EdgeOne 静态资源 404 修复记录

> 日期：2026-05-31 | 状态：Workaround 生效，平台 bug 未修复，持续跟进 | commit: 081ca6e

---

## 问题

EdgeOne 的 `opennextjs-pages@0.2.4` 插件路由正则只匹配 `/_next/static/chunks/` 下一层文件。Next.js App Router 生成的 page chunk 路径是多层的（如 `chunks/app/(main)/communities/[slug]/page-xxx.js`），CDN 缓存 miss 时返回 404。

**从 V2 上线（5/25）就存在**，被 CDN 缓存掩盖。5/30 频繁部署产生新 hash，缓存 miss 暴露 bug。

---

## 最终方案：assetPrefix + R2 CDN

浏览器直接从 Cloudflare R2 加载所有 static 文件，绕过 EdgeOne 路由层。

**改动文件：**
- `next.config.js` — `assetPrefix: 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev'`
- `scripts/upload-static-to-r2.mjs` — build 后自动上传 `.next/static/` 到 R2
- `package.json` — build: `prisma generate && next build && node scripts/upload-static-to-r2.mjs`
- `edgeone.json` — rewrite 备用（实际报 char match error，不生效，不影响）

**依赖：**
- EdgeOne 环境变量：`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`
- R2 Bucket: `opcquan-media`，公开 CDN: `https://pub-413b408ff02649388d393e4ff152b22e.r2.dev`

---

## 尝试过但无效的方案（不要重试）

| 方案 | 失败原因 |
|------|---------|
| `edgeone.json` headers 排除 | EdgeOne 不支持 |
| `_routes.json` 排除 | EdgeOne Pages 忽略此文件 |
| webpack `chunkFilename` 扁平化 | App Router page chunks 忽略用户 webpack config |
| 移除 `(main)/(auth)` route groups | `[slug]` 动态路由仍产生多层路径 |
| 代码回滚 | 新 build 新 hash，CDN 无缓存，照样 404 |

---

## 回退方法

如果未来 EdgeOne 修复了路由 bug，想回到原方案：
1. 删除 `next.config.js` 中的 `assetPrefix` 行
2. 删除 `scripts/upload-static-to-r2.mjs`
3. `package.json` build 改回 `prisma generate && next build`
4. 删除 EdgeOne 环境变量中的 R2 凭证（可选）

---

## 注意事项

- R2 旧文件会累积（每次部署 ~2.8MB），免费额度内无需清理
- R2 凭证过期或被删 → build 失败
- 本地 `next dev` 不受影响（HMR 不走 static chunks）
- contenthash 跨 Node.js 版本不一定一致，必须在同一次 build 环境里上传

---

## 腾讯云工单跟进记录（2026-06-01 ~ 2026-06-03）

### 工单结论（工程师 2026-06-02 11:43）

> "这个问题已经修复了，是 `[]` 等字符不会被 `new URL` encode，但是浏览器会，重新部署就可以了"

### 验证结果（2026-06-03）

按工程师建议创建 `test/remove-assetprefix` 分支，去掉 `assetPrefix`，绑定 EdgeOne 预览分支部署（dp1o0o5z5bei），访问 `/communities/[slug]` 详情页。

**结果：白屏，全部静态资源返回 545 错误。**

```
Failed to load resource: 545 (Unknown Status)
https://.../next/static/chunks/webpack-xxx.js
https://.../next/static/chunks/app/(main)/communities/%5Bslug%5D/page-xxx.js
https://.../next/static/css/xxx.css
（共 18 个资源全部 545）
```

**分析：**
- 腾讯云工程师说的修复是 `[]` encode 问题，与我们记录的根因（路由正则只匹配一层路径）是**两个不同的 bug**
- 545 是 EdgeOne 内部非标准状态码，连 `webpack.js` 等基础 chunk 都受影响，说明是 CDN 层的路由/处理问题，与业务代码无关
- 工程师修的那个问题对我们无效

### 当前状态

- **线上（main 分支）：** `assetPrefix` 保留，R2 workaround 正常运行，用户无感知
- **测试分支：** `test/remove-assetprefix` 保留在 GitHub，供后续平台修复后再次验证
- **工单：** 待回复，反馈「545 错误 + 根因是路由正则而非 encode 问题」

### 何时可以移除 assetPrefix

满足以下条件才考虑：
1. 腾讯云确认修复了 `opennextjs-pages` 插件的**多层路径路由匹配**问题（不只是 encode 问题）
2. 用 `test/remove-assetprefix` 分支重新预览部署，验证所有静态资源返回 200
3. 两个条件都满足后，按「回退方法」操作
