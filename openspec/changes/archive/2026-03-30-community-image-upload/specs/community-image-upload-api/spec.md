## ADDED Requirements

### Requirement: Staff-only upload endpoint
The system SHALL provide a POST `/api/admin/upload/community-image` endpoint that accepts a multipart `file` field and stores the image in R2, returning the public URL. Only authenticated users with ADMIN or MODERATOR role SHALL be permitted.

#### Scenario: Successful upload
- **WHEN** a staff user POSTs a valid JPEG/PNG/WebP file ≤5MB to `/api/admin/upload/community-image`
- **THEN** the file is stored in R2 under key `communities/{timestamp}-{random6}.{ext}` and the response is `{ url: "<R2_PUBLIC_URL>/communities/..." }` with status 200

#### Scenario: Unauthenticated request rejected
- **WHEN** a request is made without a valid session
- **THEN** the endpoint returns 401

#### Scenario: Non-staff user rejected
- **WHEN** an authenticated USER (non-staff) POSTs to the endpoint
- **THEN** the endpoint returns 403

#### Scenario: Unsupported file type rejected
- **WHEN** a staff user POSTs a file with MIME type other than image/jpeg, image/png, or image/webp
- **THEN** the endpoint returns 400 with an error message

#### Scenario: Oversized file rejected
- **WHEN** a staff user POSTs a file larger than 5MB
- **THEN** the endpoint returns 400 with an error message

#### Scenario: No file provided
- **WHEN** a staff user POSTs without a `file` field
- **THEN** the endpoint returns 400 with an error message
