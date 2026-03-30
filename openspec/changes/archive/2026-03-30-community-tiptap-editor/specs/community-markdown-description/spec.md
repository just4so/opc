## REMOVED Requirements

### Requirement: Description field uses Markdown editor
**Reason**: Replaced by `community-rich-text-editor`. The `@uiw/react-md-editor` had input lag, broken newline behavior, and could not support Word paste with inline images.
**Migration**: Description field now uses TipTap WYSIWYG editor (`RichTextEditor` component). Existing plain-text and Markdown content is handled by the backward-compatibility detection in `community-description-xss-safe`.

### Requirement: Description rendered as Markdown
**Reason**: `description` field now stores HTML output from TipTap, not Markdown. Rendering via `<ReactMarkdown>` is no longer appropriate.
**Migration**: Frontend renderer replaced with `dangerouslySetInnerHTML` + `sanitize-html`. Plain-text (and simple Markdown-like) descriptions are handled via backward-compat paragraph wrapping.
