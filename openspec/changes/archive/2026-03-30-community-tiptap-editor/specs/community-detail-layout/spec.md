## MODIFIED Requirements

### Requirement: Description rendered as sanitized HTML with prose styling
The community detail page SHALL render the `description` field as sanitized HTML inside a `<div>` with `prose prose-sm max-w-none text-gray-700` classes, replacing the previous `<ReactMarkdown>` renderer.

#### Scenario: Rich HTML description renders with prose styling
- **WHEN** a community detail page loads with an HTML description
- **THEN** the description is rendered inside a prose-styled div with correct heading, list, and paragraph formatting

#### Scenario: react-markdown is not used for description
- **WHEN** the community detail page renders
- **THEN** the `description` field is NOT rendered via `<ReactMarkdown>` (it uses `dangerouslySetInnerHTML` instead)
