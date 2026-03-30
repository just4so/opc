## ADDED Requirements

### Requirement: Cover image upload with preview
The community admin form SHALL replace the `coverImage` plain text input with a combined component that shows a thumbnail preview when a URL is set, an "Upload image" button to select a local file, and a URL text input as fallback.

#### Scenario: No image set — shows empty state
- **WHEN** `coverImage` is null or empty
- **THEN** a placeholder area and "Upload image" button are shown with no thumbnail

#### Scenario: Existing URL — shows thumbnail
- **WHEN** `coverImage` has a non-empty URL value
- **THEN** a thumbnail preview of that URL is rendered alongside the upload button and URL input

#### Scenario: File selected — uploads and updates value
- **WHEN** admin clicks "Upload image" and selects a valid file
- **THEN** the file is POSTed to `/api/admin/upload/community-image`, a loading spinner shows during upload, and on success `coverImage` is set to the returned URL and thumbnail updates

#### Scenario: Upload fails — shows error
- **WHEN** the upload request returns an error
- **THEN** an inline error message is displayed and `coverImage` retains its previous value

#### Scenario: URL entered manually — accepted as value
- **WHEN** admin types a URL directly into the fallback text input
- **THEN** `coverImage` is updated to that URL and thumbnail attempts to preview it
