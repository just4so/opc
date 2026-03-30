## Context

The community admin form currently has two plain URL text inputs for `coverImage` (single) and `images[]` (multi-line textarea). Admins must upload images separately, copy URLs, and paste them manually. The R2 upload infrastructure already exists at `app/api/upload/avatar/route.ts` and uses `@aws-sdk/client-s3` with Cloudflare R2.

The existing avatar route authenticates any logged-in user, resizes to 200×200, and keys files under `avatars/{userId}/{timestamp}.{ext}`. This change adds a parallel staff-only upload route for community images (no resize, 5MB limit, `communities/` key prefix) and replaces the form inputs with upload-capable UI components.

## Goals / Non-Goals

**Goals:**
- Add a staff-only `/api/admin/upload/community-image` endpoint reusing the existing R2 client pattern
- Replace `coverImage` text input with a combined preview + upload + URL-fallback component
- Replace `images[]` textarea with a thumbnail grid component supporting multi-file upload and removal
- Keep existing URL-based entry as fallback (paste a URL directly) for both fields

**Non-Goals:**
- No changes to the Prisma schema or database models
- No changes to the public-facing community detail page
- No image optimization or resizing (unlike avatar upload)
- No drag-and-drop (out of scope for v1)

## Decisions

### D1: Reuse `getR2Client()` pattern — do not abstract to a shared lib
The avatar route already has a self-contained `getR2Client()` factory. For now, duplicate this in the new route rather than creating a shared `lib/r2.ts`. Rationale: only two upload routes exist; premature abstraction adds indirection with minimal benefit. Revisit if a third upload route is added.

### D2: Staff auth check via `requireStaff()`, not `auth()` + role check
All other admin API routes call `requireStaff()` from `lib/admin.ts`. This keeps auth consistent and avoids ad-hoc role checks.

### D3: Key pattern independent of community ID
Use `communities/{timestamp}-{random6}.{ext}` so images can be uploaded during community creation (before an ID exists). Random suffix reduces key collision risk.

### D4: Single reusable `ImageUpload` component for cover image
Cover image and each image-array entry both need: file input trigger, upload request, loading state, error display, preview thumbnail. Extract into `components/admin/image-upload.tsx` with props `value: string | null`, `onChange: (url: string) => void`.

### D5: Separate `ImagesList` component for the images array
Managing an ordered list of URLs with add/remove is distinct enough from a single upload to warrant its own component (`components/admin/images-list.tsx`). It composes `ImageUpload` internally for each slot.

## Risks / Trade-offs

**Orphaned images**: Uploading a file then not saving the form (or saving with different data) leaves the R2 object unreferenced. → Acceptable for admin-only low-volume use. A future cleanup job can scan for unreferenced keys.

**Sequential multi-upload**: Multiple selected files are uploaded one-by-one. For 5+ large images this may be slow. → Parallel uploads add complexity; sequential is simpler and sufficient for typical admin use (≤5 images per community).

**No server-side URL validation on save**: The existing community API accepts any string for `coverImage`/`images`. Uploaded R2 URLs are trusted without signature verification. → Admin-only surface, acceptable risk.

## Migration Plan

1. Deploy new API route — no breaking changes, additive only
2. Deploy updated `community-form.tsx` with new components — form behavior unchanged for communities with existing URL values (they render as thumbnails)
3. No DB migration, no data backfill needed

## Open Questions

- None — proposal fully defines the scope.
