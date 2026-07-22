# HydroBS Project Rules

## Architecture

Backend

Controller
↓
Service
↓
Repository
↓
Database

Never bypass Service Layer.

Never place business logic inside Controllers.

---

## Frontend

Use

- React
- TypeScript
- Functional Components
- Hooks
- Reusable Components

Never duplicate components.

---

## UI Rules

Always match Dashboard Design.

Use

- Blue Theme
- White Background
- Rounded Cards
- Soft Shadows
- Responsive Layout
- Modern Typography

No inconsistent pages.

---

## Backend Rules

Every feature should include

- DTO
- Repository
- Service
- Controller
- Validation
- Exception Handling
- Audit Logging

---

## Database Rules

Community

↓

Residents

↓

Meter Readings

↓

Bills

↓

Invoices

↓

Payments

↓

Reports

↓

Audit Logs

Maintain relationships.

Never duplicate entities.

---

## Security

Use JWT.

Validate every endpoint.

Role Based Access.

Never expose sensitive APIs.

Hash passwords.

---

## Logging

Every important action should generate Audit Logs.

Examples

- Login
- Logout
- Bill Generated
- Resident Added
- Water Purchase
- CSV Upload
- Reports
- Announcements

---

## Error Handling

Return meaningful messages.

Avoid generic 500 errors.

---

## Testing

Before marking any feature complete

- Backend Compiles
- Frontend Builds
- APIs Tested
- Database Verified
- No Console Errors
- No White Pages

---

## Code Reuse

Before creating

- Component
- DTO
- Service
- Repository
- Controller
- Utility

Search existing project first.

Reuse wherever possible.

---

## General Rule

Never rewrite working code unnecessarily.

Extend existing functionality.

Maintain backward compatibility unless explicitly instructed otherwise.