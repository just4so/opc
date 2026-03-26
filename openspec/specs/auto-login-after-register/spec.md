# auto-login-after-register Specification

## Purpose
TBD - created by archiving change register-redirect-after-signup. Update Purpose after archive.
## Requirements
### Requirement: Auto-login after successful registration
The system SHALL automatically log the user in after successful registration using the credentials they just provided, without requiring them to visit the login page.

#### Scenario: Successful registration and auto-login
- **WHEN** user submits a valid registration form
- **THEN** the system SHALL register the user via `/api/users` AND immediately call `signIn("credentials", { redirect: false })` with the same credentials
- **THEN** if signIn succeeds, the system SHALL redirect to `callbackUrl` (from URL search params) or `/` if no callbackUrl is present

#### Scenario: Successful registration but auto-login fails
- **WHEN** user submits a valid registration form AND registration succeeds AND the subsequent `signIn` call fails
- **THEN** the system SHALL display a message "注册成功，请手动登录" AND redirect to `/login`

#### Scenario: Registration failure
- **WHEN** user submits a registration form AND the `/api/users` call returns an error
- **THEN** the system SHALL display the error message AND NOT attempt auto-login

### Requirement: Preserve callbackUrl through registration flow
The system SHALL read the `callbackUrl` query parameter from the registration page URL and use it as the redirect destination after successful auto-login.

#### Scenario: callbackUrl present in registration URL
- **WHEN** user visits `/register?callbackUrl=/plaza` AND completes registration and auto-login successfully
- **THEN** the system SHALL redirect to `/plaza`

#### Scenario: No callbackUrl in registration URL
- **WHEN** user visits `/register` (without callbackUrl) AND completes registration and auto-login successfully
- **THEN** the system SHALL redirect to `/`

#### Scenario: callbackUrl is an absolute external URL
- **WHEN** user visits `/register?callbackUrl=https://evil.com` AND completes registration and auto-login successfully
- **THEN** the system SHALL ignore the callbackUrl AND redirect to `/`

### Requirement: Login page passes callbackUrl to registration link
The login page "立即注册" link SHALL forward the current `callbackUrl` to the registration page so the redirect chain is preserved.

#### Scenario: Login page has callbackUrl
- **WHEN** user is on `/login?callbackUrl=/plaza` AND clicks "立即注册"
- **THEN** the system SHALL navigate to `/register?callbackUrl=/plaza`

#### Scenario: Login page has no callbackUrl
- **WHEN** user is on `/login` AND clicks "立即注册"
- **THEN** the system SHALL navigate to `/register` (no callbackUrl param)

