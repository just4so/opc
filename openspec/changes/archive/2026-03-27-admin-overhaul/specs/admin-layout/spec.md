## ADDED Requirements

### Requirement: Sidebar highlights current page
The admin sidebar SHALL visually highlight the menu item corresponding to the current page using a distinct background or text color.

#### Scenario: User is on communities page
- **WHEN** a staff user is on /admin/communities
- **THEN** the "社区管理" sidebar item is visually highlighted (e.g., background color, bold text)

#### Scenario: User navigates to a different page
- **WHEN** a staff user navigates from /admin/communities to /admin/news
- **THEN** the "资讯管理" item becomes highlighted and "社区管理" returns to normal state

### Requirement: Sidebar menu visibility follows role rules
The sidebar SHALL show menu items based on role: MODERATOR sees all content management items (dashboard, posts, communities, news, orders/合作管理) but NOT user management if it's ADMIN-only. When user management is accessible by MODERATOR (as per admin-users spec), it SHALL show but with limited functionality.

#### Scenario: MODERATOR sees content management menus
- **WHEN** a MODERATOR views the admin sidebar
- **THEN** the sidebar shows: 仪表盘, 用户管理, 动态管理, 合作管理, 社区管理, 资讯管理

#### Scenario: Menu items link to correct pages
- **WHEN** a staff user clicks "合作管理" in the sidebar
- **THEN** the browser navigates to /admin/orders

### Requirement: Sidebar label "订单管理" renamed to "合作管理"
The sidebar menu item for /admin/orders SHALL display as "合作管理" instead of "订单管理".

#### Scenario: Sidebar shows updated label
- **WHEN** a staff user views the admin sidebar
- **THEN** the orders link displays as "合作管理"
