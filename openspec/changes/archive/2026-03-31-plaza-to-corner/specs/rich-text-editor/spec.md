## ADDED Requirements

### Requirement: RichTextEditor component wraps Tiptap for post authoring
The RichTextEditor component (`components/plaza/post-rich-text-editor.tsx`) SHALL use Tiptap with StarterKit, Image, Link, Placeholder, and Typography extensions. It SHALL accept `onChange(html: string)` and `placeholder` props.

#### Scenario: Editor outputs HTML on change
- **WHEN** user types in the editor
- **THEN** onChange is called with the current HTML string from Tiptap

### Requirement: Toolbar supports common formatting actions
The toolbar SHALL include: Bold, Italic, Link (insert/edit), Image upload, Code block, Ordered list, Unordered list.

#### Scenario: Bold button toggles bold
- **WHEN** user selects text and clicks Bold
- **THEN** selected text is wrapped in `<strong>` in the output HTML

### Requirement: Image upload in editor calls /api/upload/post-image
When user clicks the Image button or pastes an image, the component SHALL upload the file to `POST /api/upload/post-image` (requires authenticated user, not staff) and insert the returned URL as an `<img>` tag.

#### Scenario: Image inserted after upload
- **WHEN** user clicks Image button and selects a file
- **THEN** file is uploaded, returned URL is inserted as an img node in the editor

#### Scenario: Upload endpoint requires authentication
- **WHEN** POST /api/upload/post-image is called without a session
- **THEN** response is 401 Unauthorized

### Requirement: RichTextEditor renders stored HTML safely
When displaying post content in detail view or card, the system SHALL render `contentHtml` using `dangerouslySetInnerHTML` after server-side sanitization. The sanitization whitelist SHALL include: p, h1, h2, h3, strong, em, ul, ol, li, a, img, blockquote, pre, code.

#### Scenario: Disallowed tags stripped on render
- **WHEN** contentHtml contains a `<script>` tag
- **THEN** rendered output has the script tag removed
