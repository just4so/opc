# v2.1-fixes-r2-p1 — R2 P1 体验优化 6 项

> R2-07 ~ R2-12，来自阿良哥 2026-05-24 人工测试反馈

---

## Task 1: R2-07 — 删除首页底部"探索更多"区块

**File:** `app/(main)/page.tsx` lines 277-308

**Current code:**
```tsx
      {/* ===== 第五屏：Footer 引导 ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-surface-card rounded-2xl p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-ink mb-4">探索更多</h3>
                <div className="space-y-3">
                  <Link
                    href="/news"
                    className="block text-mute hover:text-primary transition-colors"
                  >
                    创业资讯 →
                  </Link>
                  <Link
                    href="/tools"
                    className="block text-mute hover:text-primary transition-colors"
                  >
                    工具导航 →
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink mb-4">
                  你是社区运营方？联系我们
                </h3>
                <p className="text-sm text-mute">邮箱：cooperation@opcquan.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
```

**Target:** Delete the entire section (lines 277-308). The footer already contains navigation links and contact info.

**Acceptance:**
```bash
# Should NOT find "探索更多" in page.tsx
grep -c "探索更多" app/\(main\)/page.tsx  # expect 0
# Should NOT find "第五屏" comment
grep -c "第五屏" app/\(main\)/page.tsx  # expect 0
```

---

## Task 2: R2-08 — 注册/登录页换 logo

**Files:**
- `app/(auth)/login/page.tsx` lines 56-58 (left panel) + lines 76-77 (form header)
- `app/(auth)/register/page.tsx` lines 115-117 (left panel) + lines 134-135 (form header)

**Logo file available:** `public/logo.png` exists.

**Current code (login, left panel lines 57-58):**
```tsx
          <div className="text-5xl font-bold mb-2">OPC</div>
          <div className="text-2xl font-semibold mb-8 opacity-90">圈</div>
```

**Target (login, left panel):**
```tsx
          <img src="/logo.png" alt="OPC圈" className="h-16 mb-8" />
```

**Current code (login, form header lines 76-77):**
```tsx
            <span className="text-2xl font-bold text-primary">OPC</span>
            <span className="text-xl font-semibold text-secondary">圈</span>
```

**Target (login, form header):**
```tsx
            <img src="/logo.png" alt="OPC圈" className="h-8" />
```

**Current code (register, left panel lines 116-117):**
```tsx
          <div className="text-5xl font-bold mb-2">OPC</div>
          <div className="text-2xl font-semibold mb-8 opacity-90">圈</div>
```

**Target (register, left panel):**
```tsx
          <img src="/logo.png" alt="OPC圈" className="h-16 mb-8" />
```

**Current code (register, form header lines 134-135):**
```tsx
            <span className="text-2xl font-bold text-primary">OPC</span>
            <span className="text-xl font-semibold text-secondary">圈</span>
```

**Target (register, form header):**
```tsx
            <img src="/logo.png" alt="OPC圈" className="h-8" />
```

**Acceptance:**
```bash
# login page should have logo.png, no more OPC/圈 text rendering
grep -c 'logo.png' app/\(auth\)/login/page.tsx    # expect 2 (panel + form)
grep -c 'text-5xl.*OPC' app/\(auth\)/login/page.tsx  # expect 0

# register page same
grep -c 'logo.png' app/\(auth\)/register/page.tsx  # expect 2
grep -c 'text-5xl.*OPC' app/\(auth\)/register/page.tsx  # expect 0
```

---

## Task 3: R2-09 — 右上角"创建卡片"改为"注册"

**Files:**
- `components/layout/user-nav.tsx` line 58
- `components/layout/mobile-menu.tsx` line 135

**Current code (user-nav.tsx line 58):**
```tsx
          创建卡片
```

**Target:**
```tsx
          注册
```

**Current code (mobile-menu.tsx line 135):**
```tsx
                    创建卡片
```

**Target:**
```tsx
                    注册
```

**Acceptance:**
```bash
grep -c "创建卡片" components/layout/user-nav.tsx     # expect 0
grep -c "创建卡片" components/layout/mobile-menu.tsx   # expect 0
grep -c "注册" components/layout/user-nav.tsx           # expect >= 1
grep -c "注册" components/layout/mobile-menu.tsx         # expect >= 1
```

---

## Task 4: R2-10 — 推荐社区单独一组置顶

**File:** `components/communities/communities-page-client.tsx`

**Current code (provinceGroups memo, lines 98-109):**
```tsx
  const provinceGroups = useMemo((): ProvinceGroup[] => {
    if (isSearching || selectedCity) return []
    const groups: Record<string, Community[]> = {}
    for (const c of filtered) {
      const province = cityToProvince[c.city] || c.city
      if (!groups[province]) groups[province] = []
      groups[province].push(c)
    }
    return Object.entries(groups)
      .map(([province, communities]) => ({ province, communities }))
      .sort((a, b) => b.communities.length - a.communities.length)
  }, [filtered, isSearching, selectedCity])
```

**Target code:**
```tsx
  const featuredCommunities = useMemo(() => {
    return allCommunities.filter(c => c.featured)
  }, [allCommunities])

  const featuredIds = useMemo(() => new Set(featuredCommunities.map(c => c.id)), [featuredCommunities])

  const provinceGroups = useMemo((): ProvinceGroup[] => {
    if (isSearching || selectedCity) return []
    const nonFeatured = filtered.filter(c => !featuredIds.has(c.id))
    const groups: Record<string, Community[]> = {}
    for (const c of nonFeatured) {
      const province = cityToProvince[c.city] || c.city
      if (!groups[province]) groups[province] = []
      groups[province].push(c)
    }
    const result = Object.entries(groups)
      .map(([province, communities]) => ({ province, communities }))
      .sort((a, b) => b.communities.length - a.communities.length)
    
    const featuredInFiltered = filtered.filter(c => featuredIds.has(c.id))
    if (featuredInFiltered.length > 0) {
      result.unshift({ province: '推荐社区', communities: featuredInFiltered })
    }
    return result
  }, [filtered, isSearching, selectedCity, featuredIds])
```

**Also update expandedProvinces init (line 112)** to always expand "推荐社区":
```tsx
  useEffect(() => {
    if (provinceGroups.length > 0 && expandedProvinces.size === 0) {
      const initial = new Set(provinceGroups.slice(0, 3).map((g) => g.province))
      initial.add('推荐社区')
      setExpandedProvinces(initial)
    }
  }, [provinceGroups])
```

**Acceptance:**
```bash
grep -c "推荐社区" components/communities/communities-page-client.tsx  # expect >= 2
grep -c "featuredIds" components/communities/communities-page-client.tsx  # expect >= 2
grep -c "featuredCommunities" components/communities/communities-page-client.tsx  # expect >= 1
```

---

## Task 5: R2-11 — 后台二维码支持多 key（community + connect）

### 5a. Admin settings page — add second QR upload section

**File:** `app/admin/settings/page.tsx`

**Current code:** Single `qrCodeUrl` state, single `ImageUpload`, single save button for `community_qrcode_url`.

**Target:** Two QR sections — "社群二维码" (`community_qrcode_url`) and "直通车联系二维码" (`connect_qrcode_url`). Each has its own `ImageUpload` and save happens for both keys at once.

**Current state/load (lines 10-23):**
```tsx
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((settings: { key: string; value: string }[]) => {
        const qr = settings.find((s) => s.key === 'community_qrcode_url')
        setQrCodeUrl(qr?.value ?? '')
      })
      .finally(() => setLoading(false))
  }, [])
```

**Target state/load:**
```tsx
  const [communityQrUrl, setCommunityQrUrl] = useState('')
  const [connectQrUrl, setConnectQrUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((settings: { key: string; value: string }[]) => {
        const communityQr = settings.find((s) => s.key === 'community_qrcode_url')
        setCommunityQrUrl(communityQr?.value ?? '')
        const connectQr = settings.find((s) => s.key === 'connect_qrcode_url')
        setConnectQrUrl(connectQr?.value ?? '')
      })
      .finally(() => setLoading(false))
  }, [])
```

**Target save handler:** Save both keys sequentially:
```tsx
  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'community_qrcode_url', value: communityQrUrl }),
      })
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'connect_qrcode_url', value: connectQrUrl }),
      })
      setMessage('已保存')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }
```

**Target UI:** Two `<Card>` sections — one for 社群二维码 (community_qrcode_url), one for 直通车联系二维码 (connect_qrcode_url). Single save button at the bottom.

### 5b. Public QR API — support `key` query param

**File:** `app/api/settings/qrcode/route.ts`

**Current code:**
```ts
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'community_qrcode_url' },
    })
    return NextResponse.json({ url: setting?.value || null })
  } catch (error) {
    console.error('获取二维码设置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
```

**Target code:**
```ts
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key') || 'community_qrcode_url'
    const allowedKeys = ['community_qrcode_url', 'connect_qrcode_url']
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: '无效的 key' }, { status: 400 })
    }
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    })
    return NextResponse.json({ url: setting?.value || null })
  } catch (error) {
    console.error('获取二维码设置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
```

### 5c. Connect form success page — read `connect_qrcode_url`

**File:** `components/connect/connect-form.tsx` lines 87-93

**Current code:**
```tsx
  useEffect(() => {
    if (step === 'success') {
      fetch('/api/settings/qrcode')
        .then((res) => res.json())
        .then((data) => { if (data.url) setQrcodeUrl(data.url) })
        .catch(() => {})
    }
  }, [step])
```

**Target code:**
```tsx
  useEffect(() => {
    if (step === 'success') {
      fetch('/api/settings/qrcode?key=connect_qrcode_url')
        .then((res) => res.json())
        .then((data) => { if (data.url) setQrcodeUrl(data.url) })
        .catch(() => {})
    }
  }, [step])
```

**Acceptance:**
```bash
# Admin settings page has both keys
grep -c "connect_qrcode_url" app/admin/settings/page.tsx   # expect >= 1
grep -c "community_qrcode_url" app/admin/settings/page.tsx  # expect >= 1
grep -c "直通车" app/admin/settings/page.tsx                 # expect >= 1

# Public API supports key param
grep -c "key.*connect_qrcode_url" app/api/settings/qrcode/route.ts  # expect >= 1

# Connect form reads connect key
grep "connect_qrcode_url" components/connect/connect-form.tsx  # expect match
```

---

## Task 6: R2-12 — 广场卡片信息增强 + 产品视图筛选

### 6a. People view card — add startupStage + product website link

**File:** `components/plaza/plaza-client.tsx`

**Current code (people card, ~lines 590-598):**
```tsx
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          {user.mainTrack && <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded">{user.mainTrack}</span>}
                          {user.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </span>
                          )}
                        </div>
```

**Target code:**
```tsx
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          {user.mainTrack && <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded">{user.mainTrack}</span>}
                          {user.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </span>
                          )}
                          {user.startupStage && (
                            <span className="text-xs text-gray-400">{STAGE_LABELS[user.startupStage] || user.startupStage}</span>
                          )}
                        </div>
```

**Current code (product item in people card, ~lines 610-618):**
```tsx
                          <div key={proj.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                            <Package className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-700 truncate">{proj.name}</span>
                            <span className="text-gray-400 truncate hidden sm:inline">·</span>
                            <span className="text-gray-500 truncate hidden sm:inline">{proj.tagline}</span>
                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary shrink-0">
                              {STAGE_LABELS[proj.stage] || proj.stage}
                            </span>
                          </div>
```

**Target code:**
```tsx
                          <div key={proj.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                            <Package className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-700 truncate">{proj.name}</span>
                            <span className="text-gray-400 truncate hidden sm:inline">·</span>
                            <span className="text-gray-500 truncate hidden sm:inline">{proj.tagline}</span>
                            {proj.website && (
                              <a
                                href={proj.website.startsWith('http') ? proj.website : `https://${proj.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary shrink-0">
                              {STAGE_LABELS[proj.stage] || proj.stage}
                            </span>
                          </div>
```

Note: `ExternalLink` is already imported (line 22). `UserProject` interface (line 60) needs `website` — already has it.

### 6b. Products view card — add contentType badge

**File:** `components/plaza/plaza-client.tsx`

Add a `CONTENT_TYPE_LABELS` constant near top (after STAGE_LABELS ~line 132):
```tsx
const CONTENT_TYPE_LABELS: Record<string, string> = {
  PROJECT: '项目', DEMAND: '需求', COOPERATION: '合作',
}
```

**Current code (product card name row, ~lines 689-693):**
```tsx
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-secondary truncate">{proj.name}</h3>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary shrink-0">
                          {STAGE_LABELS[proj.stage] || proj.stage}
                        </span>
                      </div>
```

**Target code:**
```tsx
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-secondary truncate">{proj.name}</h3>
                        {proj.contentType && CONTENT_TYPE_LABELS[proj.contentType] && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                            {CONTENT_TYPE_LABELS[proj.contentType]}
                          </span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/5 text-primary shrink-0">
                          {STAGE_LABELS[proj.stage] || proj.stage}
                        </span>
                      </div>
```

### 6c. Products view — add contentType filter dropdown

**File:** `components/plaza/plaza-client.tsx`

Add state for contentType filter (near line 175):
```tsx
  const [filterContentType, setFilterContentType] = useState(searchParams.get('contentType') || '')
```

Update `fetchProjects` (line 292-312) to include contentType param:
```tsx
    if (filterContentType) params.set('contentType', filterContentType)
```

Add `filterContentType` to `fetchProjects` dependencies and the `useEffect` that triggers refetch.

**In the filter bar (lines 502-559)**, add a contentType dropdown when `mainTab === 'products'`:

After the stage `<select>` (~line 538) and before the search input, add:
```tsx
            {mainTab === 'products' && (
              <select
                value={filterContentType}
                onChange={e => setFilterContentType(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">类型</option>
                <option value="PROJECT">项目</option>
                <option value="DEMAND">需求</option>
                <option value="COOPERATION">合作</option>
              </select>
            )}
```

Update `hasActiveFilters` to include `filterContentType`:
```tsx
  const hasActiveFilters = filterDirection || filterCity || filterStage || searchQuery || filterContentType
```

Update `clearAllFilters` to clear it:
```tsx
    setFilterContentType('')
```

### 6d. API — add contentType filter support

**File:** `app/api/plaza/projects/route.ts`

**Current code (lines 4-12):** Has `direction`, `city`, `stage`, `search` params but no `contentType`.

**Add after `const search = ...` (line 12):**
```ts
    const contentType = searchParams.get('contentType') || ''
```

**Add after `if (stage) { ... }` block (~line 29):**
```ts
    if (contentType) {
      where.contentType = contentType
    }
```

**Acceptance:**
```bash
# People card shows startupStage
grep "STAGE_LABELS\[user.startupStage\]" components/plaza/plaza-client.tsx  # expect match

# People card has product website link
grep "proj.website" components/plaza/plaza-client.tsx  # expect multiple matches (people + product views)

# Product card shows contentType badge
grep "CONTENT_TYPE_LABELS" components/plaza/plaza-client.tsx  # expect >= 2

# Product filter includes contentType
grep "filterContentType" components/plaza/plaza-client.tsx  # expect >= 3

# API supports contentType
grep "contentType" app/api/plaza/projects/route.ts  # expect >= 2 (select + filter)
```
