## 1. Upload API

- [x] 1.1 Create `app/api/admin/upload/community-image/route.ts` — POST handler using `requireStaff()` auth, R2 client (same pattern as avatar route), key `communities/{timestamp}-{random6}.{ext}`, 5MB limit, JPEG/PNG/WebP only, returns `{ url }`

## 2. ImageUpload Component

- [x] 2.1 Create `components/admin/image-upload.tsx` — props: `value: string | null`, `onChange: (url: string) => void`, `label?: string`; renders thumbnail preview if value set, hidden file input, "Upload image" button that triggers input, loading spinner during upload, inline error display, URL text input as fallback

## 3. ImagesList Component

- [x] 3.1 Create `components/admin/images-list.tsx` — props: `value: string[]`, `onChange: (urls: string[]) => void`; renders 80×80px thumbnail grid with ✕ remove buttons, "Add image" button for file upload (multiple select, sequential uploads), "Add by URL" link that appends a URL input row; uses the upload API internally

## 4. Update Community Form

- [x] 4.1 In `app/admin/communities/community-form.tsx` Section C, replace the `coverImage` text input with `<ImageUpload>` bound to the `coverImage` form field
- [x] 4.2 In `app/admin/communities/community-form.tsx` Section C, replace the `images[]` textarea with `<ImagesList>` bound to the `images` form field
