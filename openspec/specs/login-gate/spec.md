# login-gate Specification

## Purpose
TBD - created by archiving change community-detail-login-gate. Update Purpose after archive.
## Requirements
### Requirement: LoginGate component renders blur overlay for unauthenticated users
The system SHALL provide a `LoginGate` Client Component at `components/community/login-gate.tsx` that accepts `isLoggedIn: boolean`, `message: string`, `registerUrl: string`, and `children: ReactNode`. When `isLoggedIn` is false, the component SHALL render children with `blur-sm` and `select-none` CSS classes, overlaid with a semi-transparent white backdrop containing a lock icon, the `message` text, and a register button linking to `registerUrl`. When `isLoggedIn` is true, the component SHALL render children directly without any overlay.

#### Scenario: Unauthenticated user sees blur overlay
- **WHEN** `isLoggedIn` is false
- **THEN** children are rendered with CSS blur and pointer-events disabled, a centered overlay displays the lock icon, message text, and a "立即免费注册" button linking to `registerUrl`

#### Scenario: Authenticated user sees full content
- **WHEN** `isLoggedIn` is true
- **THEN** children are rendered normally without any overlay or blur

### Requirement: Community detail page passes authentication state to gated sections
The page Server Component at `app/(main)/communities/[slug]/page.tsx` SHALL call `auth()` to obtain the session and compute `isLoggedIn: boolean`. This value SHALL be passed to all `LoginGate` instances and used for conditional rendering of sidebar CTA and map hint.

#### Scenario: Server component provides isLoggedIn
- **WHEN** the community detail page renders
- **THEN** `auth()` is called and `isLoggedIn` is derived from `!!session?.user`

### Requirement: Address field is gated for unauthenticated users
The address display in the sidebar "基本信息" card SHALL be wrapped in `LoginGate` with message "免费注册，查看精确地址".

#### Scenario: Unauthenticated user cannot see address
- **WHEN** user is not logged in and community has an address
- **THEN** the address area is blurred with LoginGate overlay showing "免费注册，查看精确地址"

#### Scenario: Authenticated user sees full address
- **WHEN** user is logged in and community has an address
- **THEN** the full address text is visible without any overlay

### Requirement: Contact information is gated for unauthenticated users
The contact fields (contactName, contactPhone, contactWechat) in the sidebar SHALL be grouped and wrapped in a single `LoginGate` with message "注册后查看联系人和微信".

#### Scenario: Unauthenticated user cannot see contact info
- **WHEN** user is not logged in and community has contact information
- **THEN** contact fields are blurred with LoginGate overlay showing "注册后查看联系人和微信"

#### Scenario: Authenticated user sees contact info
- **WHEN** user is logged in
- **THEN** all contact fields display normally

### Requirement: Entry process is gated with step count hint
The entry process section SHALL display the title "入驻流程（共X步）" for unauthenticated users, with the step list wrapped in `LoginGate` with message "注册后查看完整流程".

#### Scenario: Unauthenticated user sees step count but not steps
- **WHEN** user is not logged in and community has entry process steps
- **THEN** the section title shows "入驻流程（共X步）" and the step content is blurred with LoginGate

#### Scenario: Authenticated user sees all steps
- **WHEN** user is logged in
- **THEN** the full entry process displays with title "入驻流程" and all steps visible

### Requirement: Services show first 2 items with remainder gated
When there are more than 2 services, the first 2 SHALL be visible to all users. The remaining services SHALL be wrapped in `LoginGate` with message "还有X项服务，注册后查看全部". When there are 2 or fewer services, no gating is applied.

#### Scenario: Unauthenticated user sees partial services
- **WHEN** user is not logged in and community has 5 services
- **THEN** first 2 services are visible, remaining 3 are blurred with message "还有3项服务，注册后查看全部"

#### Scenario: Few services need no gating
- **WHEN** community has 2 or fewer services
- **THEN** all services are visible regardless of login status

#### Scenario: Authenticated user sees all services
- **WHEN** user is logged in
- **THEN** all services are visible without any overlay

### Requirement: Policies section is gated with existence hint
When policies data exists, unauthenticated users SHALL see a "🎁 此社区有政策扶持" badge and the policies content wrapped in `LoginGate` with message "注册后查看政策详情". Authenticated users see the full policies content.

#### Scenario: Unauthenticated user sees policy hint
- **WHEN** user is not logged in and community has policies
- **THEN** a "🎁 此社区有政策扶持" badge is shown and policy details are blurred with LoginGate

#### Scenario: Authenticated user sees full policies
- **WHEN** user is logged in
- **THEN** all policy details display normally without any overlay

### Requirement: Sidebar CTA shows registration benefits for unauthenticated users
When user is not logged in, the sidebar CTA card SHALL display: title "🔓 注册后立即解锁", a benefit checklist (✅ 精确地址, ✅ 联系人和微信, ✅ 完整入驻流程, ✅ 配套服务详情, ✅ 政策扶持详情), a "立即免费注册" button linking to `/register?callbackUrl=<current-page-path>`, and secondary text "已有账户？登录" linking to `/login?callbackUrl=<current-page-path>`.

#### Scenario: Unauthenticated user sees benefit list CTA
- **WHEN** user is not logged in
- **THEN** sidebar shows registration benefits card with register button and login link, both carrying callbackUrl

#### Scenario: Authenticated user sees bookmark button
- **WHEN** user is logged in
- **THEN** sidebar CTA shows a "收藏社区" button (placeholder onClick)

### Requirement: Map section shows registration hint for unauthenticated users
Below the map in the sidebar, a text hint "📍 注册后查看精确地址和路线" SHALL appear only for unauthenticated users. The hint uses `text-primary` color, small font size, and links to the register page with callbackUrl.

#### Scenario: Unauthenticated user sees map hint
- **WHEN** user is not logged in
- **THEN** text "📍 注册后查看精确地址和路线" appears below the map, styled in primary color, linking to register page

#### Scenario: Authenticated user sees no map hint
- **WHEN** user is logged in
- **THEN** no hint text appears below the map

