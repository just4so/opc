## ADDED Requirements

### Requirement: Community description rendered as sanitized HTML
The community detail page SHALL render the `description` field using `dangerouslySetInnerHTML` after passing it through `sanitize-html` with a conservative allowlist.

#### Scenario: Description with allowed tags renders correctly
- **WHEN** a community description contains `<p>`, `<h2>`, `<strong>`, `<ul>`, `<li>`, `<a>`, `<img>`, `<blockquote>`, `<code>`, `<pre>`, `<hr>` tags
- **THEN** all those elements render correctly in the browser

#### Scenario: Script tags are stripped
- **WHEN** a community description contains a `<script>alert('xss')</script>` tag
- **THEN** the script tag is stripped and the text "alert('xss')" does not execute

#### Scenario: iframe tags are stripped
- **WHEN** a community description contains an `<iframe>` tag
- **THEN** the iframe is removed entirely from the rendered output

#### Scenario: on* event attributes are stripped
- **WHEN** a community description contains `<img onload="alert(1)" src="...">`
- **THEN** the `onload` attribute is stripped while the `<img>` tag renders normally

### Requirement: Backward compatibility for plain-text descriptions
The community detail renderer SHALL detect descriptions without HTML tags and convert them to HTML paragraphs before rendering.

#### Scenario: Plain text description renders as paragraphs
- **WHEN** a community description is plain text with no HTML tags (e.g., `"Line one\n\nLine two"`)
- **THEN** each double-newline-separated block is wrapped in `<p>` tags and rendered

#### Scenario: HTML description renders as-is (after sanitization)
- **WHEN** a community description starts with an HTML tag (e.g., `<p>content</p>`)
- **THEN** it is passed directly to `sanitize-html` without paragraph wrapping
