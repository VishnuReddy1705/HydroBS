# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-07-20

### Added
- Implemented real-time dashboard updates via automatic polling fallback every 5 seconds for Admin, Super Admin, and Resident dashboards.
- Redesigned Reports page matching spacing, typography, dark-blue cards, cyan highlight highlights, shadows, and tables of the Business Intelligence (BI) Analytics Dashboard.
- Added `@Transactional(readOnly = true)` annotations to GET endpoints in `ResidentManagementController` to resolve `LazyInitializationException` and display residents correctly.
- Stabilized and verified all Resident Dashboard views, including my usage, billing invoice registers, family/document managers, profile, and settings.

### Fixed
- Fixed `LazyInitializationException` in `/api/users/me` (in `UserController`) and `/api/profile/me` (in `ResidentProfileController`) by adding `@Transactional(readOnly = true)` annotations, resolving the Resident Dashboard showing "No Community • Flat N/A" despite the resident being assigned to a community.

## [1.1.0] - 2026-07-19

### Added
- Wired Announcements composer/view tabs in AdminDashboard and SuperAdminDashboard.
- Wired Platform Audit Trails viewer in AdminDashboard.
- Wired Billing Cycles management interface in AdminDashboard.

### Removed
- Completely removed Calendar tab views, navigation sidebar menus, routing, and unused frontend calendar states.

## [1.0.0] - 2026-07-19

### Added
- Database migration `V18__billing_and_announcement_extensions.sql` introducing billing date range and audience targeting columns.
- Billing start and end date period support in `WaterBill` entity, `BillResponse` DTO, and PDF invoice generation.
- Dynamic announcement audience targeting based on building, flat, or resident email filters.
- Real-time community water stock and bulk purchase volumes synchronization for the Admin Dashboard statistics.

### Fixed
- Fixed 403 Forbidden authorization errors on resident profiles (`/family`, `/documents`, `/timeline`) when accessed by Admin/Super-Admin users.
- Replaced legacy flat-rate calculations in community bill calculations with correct delegation to the advanced Billing Engine.
- Fixed empty recent readings list mapping in `AdminDashboard.tsx`.
- Hided duplicate inner back buttons and resolved dead routes when viewing Resident Details as tabs.
- Refactored `BillingCycleManager.tsx` and `BulkPurchasePage.tsx` UI theme styles from dark theme (zinc-900) to standard light-blue dashboard layouts.
