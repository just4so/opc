## ADDED Requirements

### Requirement: Send verification email on registration
The system SHALL send an email verification link to the user immediately after successful registration, when the user provided an email address.

#### Scenario: Registration with email triggers verification email
- **WHEN** user submits a valid registration form with an email address
- **THEN** `POST /api/users` SHALL create a `OneTimeToken` of type `email_verify` (24h expiry)
- **THEN** the system SHALL call `sendEmailVerifyEmail(email, token)` fire-and-forget (`.catch(console.error)`)
- **THEN** the registration response SHALL NOT be delayed by the email send

#### Scenario: Registration without email skips verification email
- **WHEN** user submits a valid registration form with no email
- **THEN** `POST /api/users` SHALL NOT create an email_verify token or call the mailer

### Requirement: Auto-login after password reset
The system SHALL automatically sign the user in after a successful password reset.

#### Scenario: Auto-login succeeds after reset
- **WHEN** user submits a valid new password on `/reset-password`
- **THEN** `POST /api/auth/reset-password` SHALL return `{ message, identifier }` where `identifier` is the user's phone number
- **THEN** the client SHALL call `signIn('credentials', { email: identifier, password, redirect: false })`
- **THEN** on success the client SHALL redirect to `/`

#### Scenario: Reset-password API returns identifier
- **WHEN** `POST /api/auth/reset-password` succeeds
- **THEN** the response body SHALL include `identifier: <user.phone>` alongside `message`
