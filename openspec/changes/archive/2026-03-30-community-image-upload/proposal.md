## Why

The community admin form currently uses plain URL text inputs for `coverImage` and `images[]`. Admins must manually upload images elsewhere, copy the URL, and paste it in — a slow and error-prone workflow. The R2 infrastructure already exists (used by avatar upload at `/api/upload/avatar`). This change adds direct local file upload to the community form.

## What Changes

### 1. New Upload API: `/api/admin/upload/community-image`

Reuse the R2 upload pattern from `/api/upload/avatar/route.ts` with these differences:
- Auth: must be staff (`isStaff` check), not just any logged-in user
- Key pattern: `communities/{timestamp}-{random}.{ext}` (no community-id dependency, usable before create)
- No image resizing (communities need original quality, unlike avatars)
- Max size: 5MB
- Allowed types: JPEG, PNG, WebP
- Returns: `{ url: string }`

### 2. Cover Image Upload (Section C)

Replace the `coverImage` URL text input with:
- A combined component: thumbnail preview (if URL set) + "Upload image" button + URL text input (keep as fallback)
- On file select: POST to `/api/admin/upload/community-image`, on success set `coverImage` to returned URL
- Show upload progress (loading spinner on button)
- Show error if upload fails

### 3. Images Array Upload (Section C)

Replace the textarea (one URL per line) with an image list component:
- Existing images shown as thumbnail grid (80×80px)
- "Add image" button opens file picker (multiple select supported)
- Each selected file is uploaded sequentially; on success the URL is appended to `images[]`
- Each thumbnail has an ✕ remove button
- Keep fallback: a small "Add by URL" link that appends a URL input row

### 4. New Component: `components/admin/image-upload.tsx`

A reusable upload component used by both cover image and images array:
- Props: `value: string | null`, `onChange: (url: string) => void`, `label?: string`
- Handles: file input, upload request, loading state, error display, preview

### 5. New Component: `components/admin/images-list.tsx`

For the images array:
- Props: `value: string[]`, `onChange: (urls: string[]) => void`
- Renders thumbnail grid + add/remove controls

## Capabilities

### New Capabilities
- `community-image-upload-api`: Staff-only R2 upload endpoint for community images
- `community-cover-upload`: Cover image upload UI with preview
- `community-images-upload`: Multi-image upload UI with thumbnail grid

### Modified Capabilities
- `community-admin-form`: Section C updated with upload components

## Impact

- **New files**: `app/api/admin/upload/community-image/route.ts`, `components/admin/image-upload.tsx`, `components/admin/images-list.tsx`
- **Modified files**: `app/admin/communities/community-form.tsx` (Section C)
- **No schema changes**, no DB migration
- **No frontend (C-end) changes** — only admin form
