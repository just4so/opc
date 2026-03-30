## MODIFIED Requirements

### Requirement: Description field uses RichTextEditor
The community admin edit form's description field SHALL use `RichTextEditor` (TipTap-based) instead of `MDEditor` (`@uiw/react-md-editor`). The component SHALL be loaded via `next/dynamic` with `ssr: false`.

#### Scenario: Description field loads TipTap editor
- **WHEN** a staff user opens the community edit page
- **THEN** the description field renders the TipTap WYSIWYG editor (not a Markdown editor)

#### Scenario: Existing description displayed in editor
- **WHEN** a community with a non-empty description is opened for editing
- **THEN** the description value is displayed in the editor with correct formatting

#### Scenario: Description change updates form state
- **WHEN** the user edits the description in the editor
- **THEN** the form's description state is updated and submitted correctly on save
