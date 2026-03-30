## ADDED Requirements

### Requirement: TipTap editor renders with toolbar and editing area
The `RichTextEditor` component SHALL render a toolbar with formatting buttons and a contenteditable editing area with a minimum height of 300px that grows with content.

#### Scenario: Editor mounts with initial value
- **WHEN** the component is mounted with a non-empty `value` prop (HTML string)
- **THEN** the editor displays the HTML content with correct formatting applied

#### Scenario: Editor mounts empty with placeholder
- **WHEN** the component is mounted with an empty `value` prop and a `placeholder` prop
- **THEN** the editor displays the placeholder text in the empty editing area

### Requirement: Toolbar supports standard prose formatting
The toolbar SHALL include buttons for: H1, H2, H3, Bold, Italic, Strike, Bullet list, Ordered list, Blockquote, Code block, Horizontal rule, Clear formatting.

#### Scenario: Apply bold formatting
- **WHEN** the user selects text and clicks the Bold toolbar button
- **THEN** the selected text is wrapped in `<strong>` tags in the HTML output

#### Scenario: Insert heading
- **WHEN** the user places cursor in a paragraph and clicks H2
- **THEN** the paragraph becomes an `<h2>` heading in the HTML output

#### Scenario: Active state on toolbar button
- **WHEN** the cursor is inside bold text
- **THEN** the Bold toolbar button appears visually active (highlighted)

### Requirement: Editor calls onChange with HTML output
The `RichTextEditor` SHALL call the `onChange` prop with the current HTML string after every content change.

#### Scenario: onChange fires on text input
- **WHEN** the user types text in the editor
- **THEN** `onChange` is called with an HTML string containing the new text

### Requirement: Word paste preserves formatting
When content is pasted from a Word document, the editor SHALL preserve headings, bold, italic, and list structure while stripping unsupported Word-specific styles.

#### Scenario: Paste from Word with headings and bold
- **WHEN** the user pastes Word HTML containing `<h1>`, `<strong>`, and `<ul>` elements
- **THEN** the editor retains heading, bold, and list structure in the output HTML

#### Scenario: Paste strips mso-* styles
- **WHEN** the user pastes Word HTML containing `style="mso-bidi-font-weight: normal"` attributes
- **THEN** the pasted content renders without those style attributes

### Requirement: Inline image upload on paste
When content containing base64-encoded images (e.g., pasted from Word) is inserted into the editor, the editor SHALL automatically upload each image to R2 via `/api/admin/upload/community-image` and replace the base64 `src` with the returned R2 URL.

#### Scenario: Base64 image replaced with R2 URL after paste
- **WHEN** the user pastes content containing a `data:image/*` base64 `src`
- **THEN** the image is uploaded to R2 and the `<img>` node's `src` becomes the R2 URL

#### Scenario: Upload failure shows error notification
- **WHEN** an image upload to R2 fails during paste
- **THEN** a toast notification is shown to the user indicating the upload failed

### Requirement: Image insert via toolbar button
The toolbar SHALL include an "Insert image" button that opens a file picker; the selected file is uploaded to R2 and inserted as an `<img>` node.

#### Scenario: Insert image via file picker
- **WHEN** the user clicks the image toolbar button and selects a file
- **THEN** the file is uploaded to `/api/admin/upload/community-image` and inserted as an `<img>` with the R2 URL as `src`
