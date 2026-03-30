## ADDED Requirements

### Requirement: ISR cache is invalidated on community update
When a community is updated via the admin API, the system SHALL call `revalidatePath` for both the communities list and the specific community detail page.

#### Scenario: PATCH triggers revalidation
- **WHEN** admin saves changes to an existing community via `PATCH /api/admin/communities/[id]`
- **THEN** `revalidatePath('/communities')` and `revalidatePath('/communities/<slug>')` SHALL be called after the DB update succeeds

#### Scenario: Revalidation uses canonical slug
- **WHEN** revalidating the community detail path
- **THEN** the path SHALL use `updated.newSlug ?? updated.slug` as the slug segment

### Requirement: ISR cache is invalidated on community creation
When a new community is created via the admin API, the system SHALL call `revalidatePath` for the communities list.

#### Scenario: POST triggers list revalidation
- **WHEN** admin creates a new community via `POST /api/admin/communities`
- **THEN** `revalidatePath('/communities')` SHALL be called after the DB insert succeeds

#### Scenario: Cache is not invalidated on failed save
- **WHEN** the DB update or insert fails
- **THEN** `revalidatePath` SHALL NOT be called
