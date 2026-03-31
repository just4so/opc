## ADDED Requirements

### Requirement: Hero section displays benefit-driven headline and subtitle
The hero section SHALL display the headline "选社区，少走半年弯路" as the h1. The subtitle SHALL read "全国 {totalCommunities}+ 个 OPC 社区 · 精确到联系方式 · 免费注册查看" where {totalCommunities} is the dynamic count. The phrases "精确到联系方式" and "免费注册查看" SHALL be visually emphasized with bolder/darker styling.

#### Scenario: Hero renders with community count
- **WHEN** the homepage loads and totalCommunities is 150
- **THEN** the h1 displays "选社区，少走半年弯路" and the subtitle displays "全国 150+ 个 OPC 社区 · 精确到联系方式 · 免费注册查看" with the two key phrases visually emphasized

### Requirement: Hero primary CTA links to communities page
The hero section SHALL display a primary CTA button labeled "找适合我的社区 →" that links to `/communities`. This button SHALL use the primary (orange) filled style.

#### Scenario: User clicks primary CTA
- **WHEN** the user clicks the "找适合我的社区 →" button
- **THEN** the user navigates to `/communities`

### Requirement: Hero secondary CTA is session-aware
The hero section SHALL display a secondary CTA that shows "进入广场" (linking to `/plaza`) for logged-in users, and "免费注册" (linking to `/register`) for guests. The guest variant SHALL use an orange-border, white-background style.

#### Scenario: Guest sees register CTA
- **WHEN** a guest visits the homepage
- **THEN** the secondary CTA displays "免费注册" with orange border and white background, linking to `/register`

#### Scenario: Logged-in user sees plaza CTA
- **WHEN** a logged-in user visits the homepage
- **THEN** the secondary CTA displays "进入广场" linking to `/plaza`

### Requirement: Scenario-fork section with three intent cards
A section SHALL appear between the hero and the ActivityBar containing three cards in a responsive grid (3 columns on desktop, stacked on mobile). Each card SHALL have an icon, title, description, and action button.

Card 1: icon Search/🔍, title "正在找 OPC 社区？", description "按城市筛选，查看入驻条件", button "按城市找 →" linking to `/communities`.
Card 2: icon Building2/🏠, title "已入驻 OPC？", description "在广场找资源、找合作", button "去广场 →" linking to `/plaza`.
Card 3: icon FileText/📋, title "想了解 OPC 政策？", description "各城市最新补贴和政策解读", button "看资讯 →" linking to `/news`.

Cards SHALL have white background, `border-gray-100` border, `rounded-xl`, and hover shadow.

#### Scenario: Three intent cards render on homepage
- **WHEN** the homepage loads
- **THEN** three cards appear between the hero and ActivityBar with the specified icon, title, description, and link for each

### Requirement: Stats section shows revised four items
The stats section SHALL display four items:
1. "{totalCities}+" with label "覆盖城市"
2. "{totalCommunities}+" with label "OPC 社区"
3. "免费注册" with label "解锁联系方式"
4. "真实入驻" with label "社区攻略"

All four items SHALL use consistent styling (large text + small label). Items 3 and 4 are qualitative (not dynamic numbers).

#### Scenario: Stats render with dynamic counts and qualitative items
- **WHEN** the homepage loads with totalCities=20 and totalCommunities=150
- **THEN** stats display "20+" / "覆盖城市", "150+" / "OPC 社区", "免费注册" / "解锁联系方式", "真实入驻" / "社区攻略"

### Requirement: Bottom CTA shows registration benefits for guests only
The bottom CTA section SHALL be hidden when the user is logged in. For guests, it SHALL display:
- Title: "注册后立即可以："
- Four benefit items with white checkmarks: "查看所有社区精确地址", "获取招商联系人微信", "阅读完整入驻条件", "解锁创业广场全部内容"
- Primary button: "立即免费注册" linking to `/register` (white background, primary text color)
- Secondary text: "已有账号？登录" where "登录" links to `/login`

#### Scenario: Guest sees benefit-list CTA
- **WHEN** a guest visits the homepage
- **THEN** the bottom CTA section displays the title "注册后立即可以：", four benefit items, a "立即免费注册" button linking to `/register`, and a "登录" link to `/login`

#### Scenario: Logged-in user does not see bottom CTA
- **WHEN** a logged-in user visits the homepage
- **THEN** the bottom CTA section is not rendered in the page
