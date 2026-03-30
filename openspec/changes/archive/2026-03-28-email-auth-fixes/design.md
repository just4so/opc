## Context

Email auth infrastructure is fully in place: `OneTimeToken` model, `lib/mailer.ts`, and all API routes exist. Three implementation gaps break the email verification loop:

1. **Registration** (`POST /api/users`) creates users but never creates a `OneTimeToken` or calls the mailer — so newly-registered users with email never receive a verification link unless they go to Settings and click the button manually.
2. **Reset-password auto-login** (`reset-form.tsx`) already imports `signIn` and calls it, but passes `email: ''` — a bug introduced when copying the pattern. The API response doesn't currently return a usable identifier.
3. **Settings email bind** UI shows "未绑定" text only; there's no input form. `PUT /api/user/profile` has an explicit allowlist that excludes `email`.

The forgot-password resend and verify-email resend UI are already implemented correctly — no changes needed there.

## Goals / Non-Goals

**Goals:**
- Auto-send verification email on registration (fire-and-forget, no blocking)
- Fix reset-password auto-login to use a real identifier
- Add email bind UI to settings + allow `email` in profile PUT with uniqueness check

**Non-Goals:**
- Changing `prisma/schema.prisma`, `lib/mailer.ts`, or `lib/auth.ts`
- Email change (changing an already-bound email — out of scope)
- Adding any new npm dependencies

## Decisions

### D1: Token creation for registration verify email — inline, not via API

The `/api/auth/send-verify-email` route requires an active session (calls `auth()`). At registration time there is no session yet, so calling that route would fail. Instead, `POST /api/users` will directly create the `OneTimeToken` and fire-and-forget `sendEmailVerifyEmail` — mirroring the same pattern already used in `send-verify-email/route.ts`.

**Alternative considered**: Auto-login first, then hit the API. Rejected — adds race condition and complicates the registration handler.

### D2: Reset-password auto-login identifier — return `phone` from API

`phone` is always set (required field) and accepted by `signIn('credentials', { email: phone, password })` via the existing "isPhone" branch in `lib/auth.ts`. The API will add `identifier: user.phone` to the success response. The `reset-form.tsx` will use `data.identifier` instead of the broken `email: ''`.

**Alternative considered**: Return email if present, fallback to phone. Unnecessary complexity — phone always works.

### D3: Email bind — extend allowedFields in profile PUT

Adding `email` to the allowedFields array in `PUT /api/user/profile` keeps the change minimal. A uniqueness check (`prisma.user.findFirst({ where: { email, NOT: { id } } })`) must be added before the update. After a successful bind, the settings page client calls `POST /api/auth/send-verify-email` fire-and-forget.

**Alternative considered**: Dedicated `POST /api/auth/bind-email` endpoint. Overkill for a single field — the profile PUT already handles auth and Prisma.

## Risks / Trade-offs

- **Registration mailer fail** → fire-and-forget means a mailer error is silently swallowed (`.catch(console.error)`). Acceptable — same pattern used everywhere else; user can re-send from Settings.
- **Email uniqueness race** → two concurrent bind requests with the same email. Prisma's unique constraint on `email` will throw a P2002 error as a last-resort guard; the allowedFields check provides the user-friendly error message.
- **Reset-password auto-login failure** → if `signIn` fails after a successful reset, the form falls through to router.push('/') which may show an unauthenticated state. Acceptable — the password is already reset; the user can log in manually.
