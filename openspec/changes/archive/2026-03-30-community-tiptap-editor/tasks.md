## 1. Dependencies

- [x] 1.1 Install TipTap packages: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-typography`
- [x] 1.2 Install sanitization packages: `sanitize-html`, `@types/sanitize-html`
- [x] 1.3 Uninstall `@uiw/react-md-editor`

## 2. RichTextEditor Component

- [x] 2.1 Create `components/admin/rich-text-editor.tsx` with `'use client'` directive and `RichTextEditorProps` interface (`value`, `onChange`, `placeholder`)
- [x] 2.2 Initialize TipTap editor with `StarterKit`, `Image`, `Link`, `Placeholder`, `Typography` extensions
- [x] 2.3 Build toolbar component with grouped buttons: H1/H2/H3, Bold/Italic/Strike, BulletList/OrderedList, Blockquote, CodeBlock, HorizontalRule, Clear formatting
- [x] 2.4 Style toolbar buttons with active state (highlight when cursor is in matching node)
- [x] 2.5 Style editor area: min-height 300px, auto-grow, border + focus ring matching existing form inputs, prose class for content
- [x] 2.6 Add image toolbar button: opens hidden `<input type="file" accept="image/*">`, uploads to `/api/admin/upload/community-image`, inserts `<img>` node with R2 URL
- [x] 2.7 Add custom TipTap Extension to intercept base64 image src on paste: detect `data:image/*` src in pasted img nodes, upload to R2, replace src with R2 URL, show toast on failure

## 3. Admin Form Update

- [x] 3.1 In `app/admin/communities/community-form.tsx`, remove the `@uiw/react-md-editor` dynamic import and `MDEditor` usage
- [x] 3.2 Add `next/dynamic` import for `RichTextEditor` with `{ ssr: false }`
- [x] 3.3 Replace the `<MDEditor>` JSX with `<RichTextEditor value={description} onChange={handleDescriptionChange} placeholder="社区详细介绍..." />`

## 4. Frontend Detail Page Update

- [x] 4.1 In `app/(main)/communities/[slug]/page.tsx`, remove `ReactMarkdown` and `remarkGfm` imports from the description rendering section
- [x] 4.2 Add `sanitize-html` import and configure allowlist (p, h1-h6, ul, ol, li, strong, em, a, img, blockquote, code, pre, hr; strip script, iframe, on* attributes)
- [x] 4.3 Add `renderDescription(text: string): string` helper that detects plain text (no HTML tags) and wraps double-newline-separated blocks in `<p>` tags
- [x] 4.4 Replace the `<ReactMarkdown>` description block with `<div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderDescription(community.description ?? '')) }} />`

## 5. Verification

- [x] 5.1 Run `npm run build` and confirm no TypeScript errors
- [ ] 5.2 Manually test: open a community edit page, confirm TipTap editor loads with existing description
- [ ] 5.3 Manually test: type and format text (bold, heading, list), save, confirm rendered correctly on detail page
- [ ] 5.4 Manually test: paste from a Word document with headings and bold — confirm formatting preserved
- [ ] 5.5 Manually test: paste content with a base64 inline image — confirm image uploaded and replaced with R2 URL
- [ ] 5.6 Manually test: open a community with a plain-text description — confirm it renders as paragraphs on detail page
