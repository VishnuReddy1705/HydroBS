# Changelog

## [1.2.0] - 2026-07-20

### Added
- Implemented real-time dashboard updates via automatic polling fallback every 5 seconds for Admin, Super Admin, and Resident dashboards.
- Redesigned Reports page matching spacing, typography, dark-blue cards, cyan highlight highlights, shadows, and tables of the Business Intelligence (BI) Analytics Dashboard.
- Added `@Transactional(readOnly = true)` annotations to GET endpoints in `ResidentManagementController` to resolve `LazyInitializationException` and display residents correctly.
- Stabilized and verified all Resident Dashboard views, including my usage, billing invoice registers, family/document managers, profile, and settings.

### Fixed
- Fixed `LazyInitializationException` in `/api/users/me` (in `UserController`) and `/api/profile/me` (in `ResidentProfileController`) by adding `@Transactional(readOnly = true)` annotations, resolving the Resident Dashboard showing "No Community • Flat N/A" despite the resident being assigned to a community.