## Context

The community admin form currently uses `@uiw/react-md-editor` for the description field. This editor has two key problems: noticeable input lag, and broken behavior on newlines. More critically, the admin workflow requires pasting directly from Word documents (with headings, bold text, lists, and inline images intact) — a workflow Markdown editors cannot support.

The `community-image-upload` change provides the R2 upload API (`/api/admin/upload/community-image`) that this change depends on. The `description` field in the database remains a `String` — no schema migration needed.

## Goals / Non-Goals

**Goals:**
- Replace `@uiw/react-md-editor` with TipTap WYSIWYG editor in the community admin form
- Support Word paste: preserve headings, bold, italic, lists; auto-upload base64 inline images to R2
- Store output as HTML string in the existing `description` field
- Render description as sanitized HTML on the community detail page (XSS-safe)
- Maintain backward compatibility with existing plain-text descriptions

**Non-Goals:**
- Migrate existing Markdown or plain-text descriptions to HTML (detect and render both on frontend)
- Add TipTap to other fields or pages (plaza posts, news articles)
- Real-time collaborative editing
- Custom slash commands or mention support

## Decisions

### D1: TipTap over alternatives (Quill, Slate, CKEditor)

TipTap is built on ProseMirror (the most stable document model in the JS ecosystem), has first-class React bindings, and handles Word HTML paste via ProseMirror's existing paste cleanup. Quill is unmaintained; Slate has a complex plugin API and poor paste handling; CKEditor is heavy and commercial. TipTap also aligns with what Notion, Lark, and Linear use — a signal of production reliability.

### D2: HTML output (not JSON/Markdown)

TipTap can output JSON, HTML, or Markdown. HTML is chosen because:
1. The detail page already wraps content in a `prose` div — it just needs `dangerouslySetInnerHTML` instead of `<ReactMarkdown>`
2. No additional transformation step between editor and database
3. Backward compat is simple: detect no HTML tags → wrap in `<p>` tags

JSON (TipTap's native format) would require a JSON→HTML transform on every render, adding complexity without benefit.

### D3: Sanitize with `sanitize-html` on render (not on save)

XSS sanitization happens at render time, not on save. Rationale: sanitizing on save can corrupt content if the allowlist changes; sanitizing at render always applies the latest rules. `sanitize-html` is the standard choice — lightweight, configurable, actively maintained. Alternative (`DOMPurify`) requires a browser environment; `sanitize-html` works in Node.js (for future SSR use).

### D4: Custom paste plugin for base64 images (not ClipboardEvent override)

Word pastes embed images as `data:image/*` base64 URIs in the HTML. TipTap's ProseMirror layer strips unknown attributes but preserves `src` on img nodes. We intercept base64 `src` values in a custom TipTap Extension's `addProseMirrorPlugins` hook, upload to R2, and replace the node — keeping the rest of ProseMirror's paste pipeline intact. This is cleaner than overriding the browser's `paste` event which would bypass ProseMirror's sanitization.

### D5: Dynamic import with `ssr: false`

The editor is loaded with `next/dynamic` + `{ ssr: false }` (same pattern as the existing `MDEditor`). TipTap uses browser APIs (`window`, `document`) that don't exist in Node.js SSR context.

## Risks / Trade-offs

- **Base64 image upload race condition on paste**: Multiple images pasted at once trigger parallel uploads. If one fails, the others proceed — the failed image is left as a broken `<img>` node. Mitigation: show a toast on upload failure; admin can manually re-insert.

- **Stale HTML if sanitize-html allowlist changes**: Content saved today may render differently after an allowlist update. Mitigation: keep allowlist conservative (standard prose elements only); changes to allowlist should be reviewed as a content migration.

- **Existing plain-text descriptions with HTML-like content**: The `/<[a-z][\s\S]*>/i` detection heuristic could misclassify plain text containing angle brackets (e.g., `<name>` in a description). Mitigation: the pattern requires a valid tag structure — bare `<name>` without attributes or closing tag should not match.

- **Bundle size increase**: TipTap's core + extensions add ~120KB gzipped. Mitigated by `dynamic import` — only loaded on admin community edit page, not public pages.

## Migration Plan

1. Deploy `community-image-upload` change first (upload API must exist)
2. Deploy this change:
   - Install packages, remove `@uiw/react-md-editor`
   - New `rich-text-editor.tsx` component
   - Swap editor in `community-form.tsx`
   - Update `[slug]/page.tsx` renderer
3. No database migration needed — `description` stays `String`
4. Existing descriptions render correctly via backward-compat detection
5. Rollback: revert component swap and renderer change; no data is lost since we never transform stored values

## Open Questions

- None — proposal fully specifies requirements and the design resolves all technical choices.
