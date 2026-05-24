# v2.1-fixes-r2-p0 Tasks

> R2-01 ~ R2-06 (P0 功能 Bug)
> Branch: `feat/v2-redesign`

---

## - [ ] R2-01: 社区列表多关键词搜索不生效

**File:** `components/communities/communities-page-client.tsx` ~line 88-93

**Current code:**
```tsx
if (isSearching) {
  const q = searchQuery.trim().toLowerCase()
  result = result.filter(
    (c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
  )
}
```

**Target code:**
```tsx
if (isSearching) {
  const keywords = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
  result = result.filter((c) => {
    const haystack = `${c.name} ${c.city}`.toLowerCase()
    return keywords.every((kw) => haystack.includes(kw))
  })
}
```

**Acceptance criteria:**
```bash
# Verify split + every pattern exists
grep -n 'split.*\\\\s' components/communities/communities-page-client.tsx
grep -n '\.every' components/communities/communities-page-client.tsx
# Verify old single-match pattern is gone
grep -c 'c\.name\.toLowerCase()\.includes(q)' components/communities/communities-page-client.tsx
# Expected: 0
```

---

## - [ ] R2-02: 未登录时政策不可见

**File:** `app/(main)/communities/[slug]/page.tsx` ~line 682-743

**Current state:** 政策侧边栏 (`{localPolicies.length > 0 && (...)}`) 已在侧边栏中 (line 682)，位于 Layer 2 ternary (lines 355-576) 之外。代码结构上并未被 `isLoggedIn` 条件包裹。

**验证步骤：** 确认政策区块确实不在任何 `isLoggedIn` 条件内。如果已经是始终渲染，标记为"已修复/无需改动"。如果有隐藏机制（CSS 或其他条件），移除之。

```bash
# Check: policy card is NOT inside any isLoggedIn conditional
# Lines 682-743 should be at sidebar indent level (12 spaces), not deeper
sed -n '682,683p' app/\(main\)/communities/\[slug\]/page.tsx
# Should see: {/* 本地政策支持 */} and {localPolicies.length > 0 && (
# Verify no isLoggedIn wrapping in nearby context
sed -n '676,685p' app/\(main\)/communities/\[slug\]/page.tsx | grep -c 'isLoggedIn'
# Expected: 0
```

---

## - [ ] R2-03: 无联系方式的社区仍显示"该社区暂无联系方式"

**File:** `app/(main)/communities/[slug]/page.tsx` ~line 648-662

**Current code:**
```tsx
) : isLoggedIn ? (
  <div className="flex items-start">
    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
    <div>
      <div className="text-sm text-gray-500">联系信息</div>
      <p className="text-xs text-gray-400 mt-1">该社区暂无联系方式</p>
      <Link
        href={`/connect/${community.slug}`}
        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary text-on-primary text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        🟢 提交意向，专人帮你对接
      </Link>
    </div>
  </div>
) : null}
```

**Target code:** 无联系方式时不渲染联系信息区块，只保留直通车入口：
```tsx
) : (
  <div className="flex items-start">
    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
    <div>
      <Link
        href={`/connect/${community.slug}`}
        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-primary text-on-primary text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        🟢 提交意向，专人帮你对接
      </Link>
    </div>
  </div>
)}
```

注意：
1. 去掉 `isLoggedIn ?` 条件 — 无论登录与否都显示直通车入口
2. 删掉 `<div className="text-sm text-gray-500">联系信息</div>` 标签
3. 删掉 `<p>该社区暂无联系方式</p>` 文案

**Acceptance criteria:**
```bash
# "暂无联系方式" text should be gone
grep -c '暂无联系方式' app/\(main\)/communities/\[slug\]/page.tsx
# Expected: 0
# 直通车 link should still exist
grep -c '提交意向，专人帮你对接' app/\(main\)/communities/\[slug\]/page.tsx
# Expected: 1
```

---

## - [ ] R2-04: BP 上传大小限制改为 20MB

**File:** `app/api/upload/bp/route.ts` line 14

**Current code:**
```ts
const MAX_SIZE_MB = 10
```

**Target code:**
```ts
const MAX_SIZE_MB = 20
```

**Acceptance criteria:**
```bash
grep -n 'MAX_SIZE_MB' app/api/upload/bp/route.ts
# Expected: const MAX_SIZE_MB = 20
```

---

## - [ ] R2-05: 广场引导条 showInPlaza 从 JWT 取不到

**File:** `components/plaza/plaza-client.tsx` ~line 391

**Current code:**
```tsx
const userHasCard = !!(session?.user as any)?.showInPlaza
```

**问题：** `showInPlaza` 不在 JWT token 中，`session.user` 上永远拿不到，`userHasCard` 永远为 `false`。

**修复方案（选一）：**

**方案 A — JWT callback 加字段（推荐，零额外请求）：**

在 `lib/auth.ts` 的 JWT callback 中查库写入 `showInPlaza`，session callback 透传：

```ts
// lib/auth.ts — jwt callback
async jwt({ token, user, trigger }) {
  // ... existing code ...
  if (trigger === 'signIn' || trigger === 'update') {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { showInPlaza: true },
    })
    if (dbUser) token.showInPlaza = dbUser.showInPlaza
  }
  return token
}

// lib/auth.ts — session callback
async session({ session, token }) {
  // ... existing code ...
  (session.user as any).showInPlaza = token.showInPlaza ?? false
  return session
}
```

然后 `plaza-client.tsx` 的 `userHasCard` 行不需要改。

**方案 B — API 查询（额外一次请求）：**

```tsx
const [userHasCard, setUserHasCard] = useState(false)
useEffect(() => {
  if (session?.user) {
    fetch('/api/user/card').then(r => r.json()).then(d => setUserHasCard(d.hasCard))
  }
}, [session])
```

**Acceptance criteria:**
```bash
# Verify showInPlaza is in JWT callback
grep -n 'showInPlaza' lib/auth.ts
# Expected: at least 2 matches (jwt + session callbacks)
# Verify plaza-client still reads it
grep -n 'showInPlaza' components/plaza/plaza-client.tsx
# Expected: at least 1 match
```

---

## - [ ] R2-06: 广场引导条"让 5 位创业者看到你"数字太小

**File:** `components/plaza/plaza-client.tsx` ~line 404

**Current code:**
```tsx
text = `创建你的名片，让 ${initialPlazaUserTotal} 位创业者看到你`
```

**Target code:**
```tsx
text = '创建你的名片，让更多创业者看到你'
```

同时清理不再使用的 `initialPlazaUserTotal`（如果仅此处使用）。

**Acceptance criteria:**
```bash
# New text exists
grep -c '让更多创业者看到你' components/plaza/plaza-client.tsx
# Expected: 1
# Old interpolated text is gone
grep -c 'initialPlazaUserTotal.*位创业者' components/plaza/plaza-client.tsx
# Expected: 0
```
