## MODIFIED Requirements

### Requirement: Section C uses upload components for images
The community admin form Section C (Media) SHALL use `ImageUpload` for `coverImage` and `ImagesList` for `images[]` instead of plain text inputs.

#### Scenario: Cover image field renders ImageUpload component
- **WHEN** admin opens the community edit form
- **THEN** the cover image field renders the `ImageUpload` component (not a plain text input), bound to the `coverImage` form field

#### Scenario: Images array field renders ImagesList component
- **WHEN** admin opens the community edit form
- **THEN** the images array field renders the `ImagesList` component (not a textarea), bound to the `images` form field

#### Scenario: Form save includes uploaded URLs
- **WHEN** admin uploads images via the new components and submits the form
- **THEN** the submitted payload includes the R2 URLs in `coverImage` and `images[]` exactly as returned by the upload API
