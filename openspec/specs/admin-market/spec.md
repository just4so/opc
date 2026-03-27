# admin-market Specification

## Purpose
TBD - created by archiving change admin-overhaul. Update Purpose after archive.
## Requirements
### Requirement: Market management uses existing orders module
The market/合作广场 management SHALL be served by the existing /admin/orders module (which already provides full CRUD, search, filter, export functionality with isStaff permission). The sidebar label SHALL be changed from "订单管理" to "合作管理" to better reflect the content.

#### Scenario: Sidebar shows "合作管理" label
- **WHEN** a staff user views the admin sidebar
- **THEN** the orders management link displays as "合作管理" instead of "订单管理"

#### Scenario: Existing orders functionality remains intact
- **WHEN** a staff user navigates to /admin/orders
- **THEN** all existing features (search, type filter, status filter, featured toggle, hide/show, delete, CSV export) continue to work

