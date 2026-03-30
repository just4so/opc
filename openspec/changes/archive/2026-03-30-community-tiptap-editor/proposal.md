## Why

The current community description editor (`@uiw/react-md-editor`) has significant UX problems: noticeable input lag, broken behavior on newlines. More importantly, admins need to paste content directly from Word documents (preserving headings, bold text, lists, and inline images) — a workflow that Markdown editors cannot support. TipTap is the industry-standard solution (used by Notion, Lark, etc.) for this use case.

## What Changes

### 1. Install TipTap Dependencies

Required packages:
- `@tiptap/react` — React bindings
- `@tiptap/pm` — ProseMirror core (peer dep)
- `@tiptap/starter-kit` — Bundled extensions: Heading, Bold, Italic, Strike, Code, Blockquote, BulletList, OrderedList, HardBreak, HorizontalRule, History
- `@tiptap/extension-image` — Image node
- `@tiptap/extension-link` — Hyperlink support
- `@tiptap/extension-placeholder` — Placeholder text
- `@tiptap/extension-typography` — Smart quotes etc.

Uninstall: `@uiw/react-md-editor` (no longer needed)

### 2. New Component: `components/admin/rich-text-editor.tsx`

A `'use client'` component wrapping TipTap with:

**Toolbar** (icon buttons, grouped):
- Headings: H1, H2, H3
- Format: Bold, Italic, Strike
- Lists: Bullet list, Ordered list
- Others: Blockquote, Code block, Horizontal rule, Clear formatting
- Image: "Insert image" button → opens file picker → uploads to `/api/admin/upload/community-image` → inserts `<img>` node with R2 URL

**Editor area**:
- Min height: 300px, auto-grows
- Prose styling via Tailwind `prose` class
- Border + focus ring matching existing form inputs

**Word paste handling**:
- TipTap's `StarterKit` already strips most Word junk HTML on paste
- Add a custom paste rule to handle `data:image/*` base64 images pasted from Word: intercept, upload to R2, replace with R2 URL
- Strip `mso-*` styles on paste (TipTap does this automatically via ProseMirror)

**Output**: HTML string (stored in `description` field)

**Props**:
```typescript
interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}
```

### 3. Update Admin Form (Section E)

In `app/admin/communities/community-form.tsx`:
- Remove `@uiw/react-md-editor` dynamic import
- Replace `MDEditor` with `RichTextEditor` (dynamic import, `ssr: false`)
- The independent `description` state and `handleDescriptionChange` pattern stays — just swap the component

### 4. Update Frontend Detail Page

In `app/(main)/communities/[slug]/page.tsx`:
- Description is now stored as HTML, not Markdown
- Replace `<ReactMarkdown>` rendering with:
  ```tsx
  <div 
    className="prose prose-sm max-w-none text-gray-700"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(community.description) }}
  />
  ```
- Add `sanitize-html` package to strip any dangerous tags/attributes before rendering (XSS protection)
- Install: `npm install sanitize-html @types/sanitize-html`
- Sanitize config: allow standard HTML tags (p, h1-h6, ul, ol, li, strong, em, a, img, blockquote, code, pre, hr), strip scripts/iframes

### 5. Backward Compatibility for Existing Plain-Text Descriptions

Some communities have plain text (no HTML tags) in `description`. The frontend renderer must handle both:
```typescript
function renderDescription(text: string): string {
  // If it looks like plain text (no HTML tags), wrap paragraphs in <p>
  if (!/<[a-z][\s\S]*>/i.test(text)) {
    return text.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('')
  }
  return text // Already HTML
}
```

### 6. Remove react-markdown dependency

After replacing the detail page renderer with `dangerouslySetInnerHTML`, remove `react-markdown` and `remark-gfm` imports from the detail page (can keep packages installed for now if used elsewhere, but remove from this file).

## Capabilities

### New Capabilities
- `community-rich-text-editor`: TipTap-based WYSIWYG editor with Word paste support and image upload
- `community-description-xss-safe`: Sanitized HTML rendering on frontend

### Modified Capabilities
- `community-admin-form`: Section E description field replaced with RichTextEditor
- `community-detail-layout`: Description rendered as sanitized HTML with prose styling

### Removed Capabilities
- `community-markdown-description`: Replaced by HTML-based rich text

## Impact

- **New files**: `components/admin/rich-text-editor.tsx`
- **Modified files**:
  - `app/admin/communities/community-form.tsx` — swap editor component
  - `app/(main)/communities/[slug]/page.tsx` — swap renderer, add sanitize
  - `package.json` — add TipTap packages + sanitize-html, remove @uiw/react-md-editor
- **No schema changes** — `description` remains `String`, stores HTML instead of Markdown
- **Backward compatible** — plain text descriptions detected and rendered correctly
- **Depends on**: `community-image-upload` change must be deployed first (editor uses the upload API)
