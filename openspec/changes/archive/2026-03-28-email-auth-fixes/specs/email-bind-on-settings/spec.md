## ADDED Requirements

### Requirement: Bind email from settings page
The system SHALL allow an authenticated user with no email to bind one from the settings page "账户安全" card.

#### Scenario: Email bind form shown when no email
- **WHEN** user visits `/settings` AND `userEmail` is null
- **THEN** the system SHALL display an email input field and a "绑定邮箱" button

#### Scenario: Successful email bind and verification email sent
- **WHEN** user enters a valid, unused email and clicks "绑定邮箱"
- **THEN** the system SHALL call `PUT /api/user/profile` with `{ email }`
- **THEN** on 200 response, the system SHALL call `POST /api/auth/send-verify-email` fire-and-forget
- **THEN** the system SHALL display "已绑定 <email>，验证邮件已发送"

#### Scenario: Email already taken
- **WHEN** user enters an email already registered to another account
- **THEN** `PUT /api/user/profile` SHALL return 400 with `{ error: '邮箱已被使用' }`
- **THEN** the UI SHALL display the error message under the input

#### Scenario: Email bind UI hidden when email already bound
- **WHEN** `userEmail` is not null
- **THEN** the settings page SHALL NOT show the bind input form (only the existing verify flow)

### Requirement: Profile PUT supports email field
The `PUT /api/user/profile` endpoint SHALL accept an `email` field and update it after uniqueness validation.

#### Scenario: Valid new email update
- **WHEN** authenticated user sends `PUT /api/user/profile` with a valid, unused `email`
- **THEN** the system SHALL update the user's email and return the updated profile

#### Scenario: Duplicate email rejected
- **WHEN** authenticated user sends `PUT /api/user/profile` with an email already used by another user
- **THEN** the system SHALL return 400 with `{ error: '邮箱已被使用' }`
