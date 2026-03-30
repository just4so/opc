## ADDED Requirements

### Requirement: CommunityPolicies TypeScript interface is defined
The system SHALL define a `CommunityPolicies` interface in `lib/types/community.ts` that models the shape of the `policies` JSON field.

#### Scenario: Interface is importable
- **WHEN** any file imports `CommunityPolicies` from `@/lib/types/community`
- **THEN** TypeScript SHALL enforce the shape with no type errors

#### Scenario: Interface allows partial policies
- **WHEN** a community has only some policy keys populated
- **THEN** the interface SHALL allow all keys to be optional (`?`)

### Requirement: Admin form renders structured policies sub-form
The admin community form Section D SHALL render each key of `CommunityPolicies` as a dedicated input component instead of a raw JSON textarea.

#### Scenario: Record fields render as key-value pair inputs
- **WHEN** admin edits a `Record<string, string>` policy field (e.g., `spaceSubsidy`, `coreBenefits`, `vouchers`)
- **THEN** the form SHALL display a list of key-value pair rows with add/remove controls

#### Scenario: Array fields render as list inputs
- **WHEN** admin edits a `string[]` policy field (e.g., `computeSubsidy`, `comprehensive`, `support`)
- **THEN** the form SHALL display an array input with add/remove row controls

#### Scenario: Empty policies field initializes to empty object
- **WHEN** a community has `policies: null` and admin opens the form
- **THEN** the policies sub-form SHALL initialize with all keys empty (not crash)

#### Scenario: Policies are saved as valid JSON
- **WHEN** admin saves the community form
- **THEN** the `policies` value submitted to the API SHALL be a valid JSON object conforming to `CommunityPolicies`

### Requirement: policies field is cast to CommunityPolicies at usage sites
Wherever `community.policies` is accessed in TypeScript code, it SHALL be cast to `CommunityPolicies` (not `any` or `unknown`).

#### Scenario: Detail page uses typed policies
- **WHEN** the detail page renders policy sections
- **THEN** TypeScript SHALL not require `as any` casts to access policy sub-keys
