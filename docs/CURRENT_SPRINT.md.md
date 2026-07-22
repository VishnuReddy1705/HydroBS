# Sprint 1 - Core Stabilization

## Goal

HydroBS must become a fully functional SaaS application.

Fix root causes.

Do not use temporary workarounds.

---

# Task 1

## Reports

The current Reports page is unacceptable.

Delete the current implementation if necessary.

Redesign it using the Dashboard as the design reference.

Requirements

- Same spacing
- Same cards
- Same typography
- Same colors
- Same shadows
- Same responsiveness

Remove the large empty preview panel.

Create a professional analytics page.

Include

Summary Cards

- Water Usage
- Revenue
- Bills Generated
- Pending Bills
- Communities
- Residents

Charts

- Water Usage Trend
- Revenue Trend
- Community Comparison
- Billing Collection
- Resident Consumption

Tables

- Resident Report
- Billing Report
- Community Report

Filters

- Community
- Building
- Resident
- Date Range

Exports

- PDF
- Excel
- CSV

---

# Task 2

## Community Admin

Residents are NOT displayed.

Find the root cause.

Verify

Repository

↓

Service

↓

DTO

↓

Controller

↓

REST API

↓

Frontend

↓

State

↓

Table

Residents must display correctly.

Searching

Filtering

Pagination

CRUD

must work.

---

# Task 3

## Meter Reading

Whenever

Manual Reading

or

CSV Upload

is completed

Immediately update

Resident Dashboard

Community Dashboard

Reports

Billing

Invoices

Charts

Recent Readings

Statistics

Notifications

Audit Logs

No page refresh.

Implement proper real-time synchronization.

Preferred

Spring WebSocket + STOMP.

Fallback

Automatic polling.

---

# Task 4

## Resident Dashboard

Login as a Resident.

Test

Dashboard

Bills

Invoices

Recent Readings

Announcements

Notifications

Profile

Settings

Fix every issue.

---

Definition of Done

Reports redesigned.

Residents fixed.

Resident Dashboard working.

Real-time synchronization working.

Testing_Checklist passed.

Backend builds.

Frontend builds.

No console errors.

No backend exceptions.