## MODIFIED Requirements

### Requirement: Authenticated user sees bookmark button
The community detail page (`app/(main)/communities/[slug]/page.tsx`) SHALL, when the user is authenticated, render no sidebar CTA card in place of the former disabled "收藏社区" Card. The disabled "收藏社区" Card SHALL be removed entirely. The unauthenticated CTA card (showing "🔓 注册后立即解锁" benefits list) SHALL remain unchanged.

#### Scenario: Authenticated user sees no CTA card
- **WHEN** user is logged in and views a community detail page
- **THEN** no "收藏社区" or any placeholder card is shown in the sidebar CTA area

#### Scenario: Unauthenticated user still sees registration CTA
- **WHEN** user is not logged in
- **THEN** the sidebar shows the "🔓 注册后立即解锁" benefits card with register button and login link, carrying callbackUrl
