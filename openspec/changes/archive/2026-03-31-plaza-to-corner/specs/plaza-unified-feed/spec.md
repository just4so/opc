## ADDED Requirements

### Requirement: Unified feed page displays all post types
The system SHALL display a unified feed at `/plaza` titled「交流广场」with subtitle「OPC创业者的交流空间」, supporting CHAT/HELP/SHARE/COLLAB four post types. The page SHALL use ISR with 60s revalidation.

#### Scenario: Page renders with default view
- **WHEN** user visits `/plaza`
- **THEN** page title shows「交流广场」, all posts are listed regardless of type, default tab is「全部」

#### Scenario: Tab filtering
- **WHEN** user selects a type tab (CHAT/HELP/SHARE/COLLAB)
- **THEN** only posts of that type are shown, URL or state reflects active filter

### Requirement: Tab/filter component adapts to screen size
On desktop the system SHALL display 5 horizontal tabs (全部/💬聊聊/❓求助/📣分享/🤝找人). On mobile (screen width < 768px) the system SHALL replace tabs with a native `<select>` dropdown showing the same 5 options.

#### Scenario: Desktop tab display
- **WHEN** viewport width >= 768px
- **THEN** 5 tab buttons are visible, currently active tab is highlighted

#### Scenario: Mobile dropdown display
- **WHEN** viewport width < 768px
- **THEN** a `<select>` element is shown instead of tabs, selected option matches the active filter

### Requirement: Left sidebar displays community stats
The system SHALL show a left sidebar (desktop only) with: (1) 热议话题 — top tags from posts in the last 7 days; (2) 本周活跃用户 — top 5 users by post count this week, hidden if fewer than 5 users qualify; (3) 发布统计 — post counts for this week and this month.

#### Scenario: Hot topics list
- **WHEN** sidebar is rendered
- **THEN** up to 10 most-used topic tags from the last 7 days are shown, each linking to filter by that tag

#### Scenario: Active users list hidden when insufficient data
- **WHEN** fewer than 5 users posted this week
- **THEN** the active users section is not rendered

### Requirement: Navigation updated to remove market entry
The system SHALL update the main navigation to remove the「合作广场」link and rename「创业广场」to「交流广场」.

#### Scenario: Nav shows updated label
- **WHEN** user views the main navigation
- **THEN**「合作广场」link is absent,「交流广场」link points to `/plaza`
