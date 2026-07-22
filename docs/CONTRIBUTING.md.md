# Contributing to HydroBS

Thank you for contributing to HydroBS!

This document defines the development workflow, coding standards, documentation requirements, and review process.

---

# Project Philosophy

HydroBS is built with the following principles:

- Clean Architecture
- Maintainable Code
- Reusable Components
- Secure Development
- Enterprise UI
- Comprehensive Documentation
- Automated Testing

Every contribution should improve the project without reducing quality.

---

# Before You Start

Read the following documents first:

- README.md
- docs/01_PROJECT_CONTEXT.md
- docs/02_MASTER_SPEC.md
- docs/03_DATABASE.md
- docs/04_API_DOCUMENTATION.md
- docs/05_UI_DESIGN_GUIDELINES.md
- docs/06_BUSINESS_RULES.md
- docs/09_TESTING_CHECKLIST.md
- docs/ARCHITECTURE.md
- docs/SECURITY.md

Do not begin development without understanding these documents.

---

# Branch Naming

Use descriptive branch names.

Examples

feature/billing-dashboard

feature/csv-import

feature/water-purchase

bugfix/login-error

bugfix/report-filter

hotfix/security-patch

docs/update-readme

---

# Commit Message Format

Use clear commit messages.

Examples

feat: add billing dashboard

feat: implement CSV validation

fix: correct resident dashboard refresh

fix: prevent duplicate meter readings

docs: update architecture guide

refactor: simplify billing service

test: add CSV upload tests

Avoid vague messages like:

update

changes

fix

done

---

# Coding Standards

Backend

- Keep controllers thin.
- Put business logic in services.
- Use DTOs for API requests and responses.
- Use constructor injection.
- Handle exceptions centrally.
- Write meaningful method names.

Frontend

- Keep components reusable.
- Avoid duplicated UI.
- Follow the design system.
- Use consistent naming.
- Keep pages focused on layout.
- Move API calls into services.

Database

- Use proper foreign keys.
- Add indexes where needed.
- Never modify old migrations.
- Create new migrations for schema changes.

---

# Documentation Requirements

When adding or changing a feature, update documentation if needed.

Examples

New API

→ Update API documentation

Database change

→ Update database documentation

Business logic change

→ Update business rules

UI redesign

→ Update UI guidelines

Architecture change

→ Update architecture document

Release

→ Update CHANGELOG.md

---

# Testing Requirements

Before opening a pull request:

- Backend builds successfully
- Frontend builds successfully
- Manual testing completed
- Relevant automated tests pass
- No browser console errors
- No backend exceptions
- Responsive layout verified
- Business rules followed

Refer to:

docs/09_TESTING_CHECKLIST.md

---

# Pull Request Checklist

Before submitting:

- Feature implemented
- Code reviewed
- Documentation updated
- Tests completed
- No merge conflicts
- CHANGELOG updated (if applicable)
- Screenshots attached for UI changes

---

# Code Review Guidelines

Reviewers should verify:

- Correctness
- Readability
- Security
- Performance
- Maintainability
- Documentation updates
- Test coverage
- Consistency with architecture

---

# AI Assistant Workflow

If using Antigravity or another AI coding assistant:

1. Read the project documentation before generating code.
2. Follow the architecture and business rules.
3. Reuse existing components where possible.
4. Do not duplicate code.
5. Update documentation when features change.
6. Run through the testing checklist before marking work complete.
7. Add an entry to CHANGELOG.md for significant changes.

---

# Reporting Issues

When reporting a bug, include:

- Description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser / OS
- Relevant logs

---

# Feature Requests

Provide:

- Problem statement
- Proposed solution
- Expected benefits
- Impacted modules
- Any UI mockups or examples

---

# Development Principles

Prefer:

- Readability over cleverness
- Simplicity over complexity
- Reuse over duplication
- Explicitness over assumptions
- Documentation alongside code

---

# Thank You

Every contribution—whether code, documentation, testing, or design—helps make HydroBS more reliable, maintainable, and useful.

Please keep the project consistent with its architecture, business rules, and design guidelines.