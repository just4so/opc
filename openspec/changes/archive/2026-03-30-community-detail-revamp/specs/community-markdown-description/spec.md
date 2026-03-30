## ADDED Requirements

### Requirement: Admin edits description with Markdown editor
The admin community form SHALL replace the plain `<textarea>` for the `description` field with a split-pane Markdown editor (`@uiw/react-md-editor`) that shows edit and preview panes simultaneously.

#### Scenario: Editor renders split pane
- **WHEN** admin opens the community edit form
- **THEN** the description field displays a split-pane editor with raw Markdown on the left and rendered preview on the right

#### Scenario: Editor is loaded client-side only
- **WHEN** the admin form page is server-rendered
- **THEN** the Markdown editor SHALL be dynamically imported with `{ ssr: false }` to avoid hydration errors

#### Scenario: Existing plain-text description is preserved
- **WHEN** admin opens a community that has a plain-text description (no Markdown)
- **THEN** the editor displays the plain text as-is and the preview renders it as a single paragraph

### Requirement: Frontend renders description as Markdown
The community detail page SHALL render the `description` field using `react-markdown` with `remark-gfm`, replacing the current `whitespace-pre-line` CSS rendering.

#### Scenario: Markdown content is rendered
- **WHEN** a visitor views a community detail page where `description` contains Markdown
- **THEN** headings, bold, italic, lists, and links SHALL be rendered as HTML

#### Scenario: Plain text is rendered safely
- **WHEN** `description` contains plain text with no Markdown syntax
- **THEN** the rendered output SHALL be visually equivalent to plain paragraph text

#### Scenario: Description is wrapped in prose styles
- **WHEN** the description is rendered on the detail page
- **THEN** it SHALL be wrapped in `<div className="prose prose-gray max-w-none">` for consistent typography
