## ADDED Requirements

### Requirement: Images array upload with thumbnail grid
The community admin form SHALL replace the `images[]` multi-line textarea with a thumbnail grid component. Admins SHALL be able to add images via file upload or URL, and remove existing images individually.

#### Scenario: No images — shows empty state with add button
- **WHEN** `images` array is empty
- **THEN** an "Add image" button is shown and no thumbnails are rendered

#### Scenario: Existing images — rendered as thumbnail grid
- **WHEN** `images` contains one or more URLs
- **THEN** each URL is shown as an 80×80px thumbnail with an ✕ remove button

#### Scenario: File upload appends to array
- **WHEN** admin clicks "Add image", selects one or more files, and uploads succeed
- **THEN** each returned URL is appended to `images[]` and new thumbnails appear in the grid

#### Scenario: Multiple files uploaded sequentially
- **WHEN** admin selects multiple files at once
- **THEN** files are uploaded one at a time in selection order; each successful upload appends its URL immediately

#### Scenario: Remove button removes image
- **WHEN** admin clicks ✕ on a thumbnail
- **THEN** that URL is removed from `images[]` and the thumbnail disappears

#### Scenario: Add by URL fallback
- **WHEN** admin clicks "Add by URL" and enters a URL
- **THEN** that URL is appended to `images[]` and a thumbnail is shown

#### Scenario: Upload error on one file — others continue
- **WHEN** one file in a multi-file selection fails to upload
- **THEN** an inline error is shown for that file; other files in the batch continue uploading
