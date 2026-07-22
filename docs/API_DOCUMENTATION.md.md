# HydroBS API Documentation

---

# API Version

v1

Base URL

/api

Authentication

JWT Bearer Token

Content-Type

application/json

---

# Authentication APIs

## Login

POST

/api/auth/login

Description

Authenticate user and return JWT Token.

Request

{
    "email": "user@email.com",
    "password": "password"
}

Response

{
    "token": "...",
    "role": "COMMUNITY_ADMIN"
}

---

## Register Community Admin

POST

/api/auth/register-admin

Creates

Community

Community Admin

Default Settings

---

## Register Resident

POST

/api/auth/register-resident

Creates

Resident

Assign Community

Assign Meter

---

## Logout

POST

/api/auth/logout

Invalidates Session

Creates Audit Log

---

# Community APIs

## Get Communities

GET

/api/communities

Returns

All Communities

Supports

Pagination

Search

Sorting

---

## Create Community

POST

/api/communities

Creates Community

Creates Audit Log

---

## Update Community

PUT

/api/communities/{id}

Updates

Community Information

---

## Delete Community

DELETE

/api/communities/{id}

Soft Delete Preferred

---

# Resident APIs

## Get Residents

GET

/api/residents

Supports

Community Filter

Search

Pagination

Status

Flat Number

---

## Get Resident

GET

/api/residents/{id}

---

## Add Resident

POST

/api/residents

Creates

Resident

Meter

Audit Log

---

## Update Resident

PUT

/api/residents/{id}

Updates

Resident Profile

---

## Delete Resident

DELETE

/api/residents/{id}

Soft Delete Preferred

---

# Meter Reading APIs

## Get Readings

GET

/api/readings

Supports

Resident

Community

Date

Meter

CSV

---

## Add Reading

POST

/api/readings

Request

Resident

Meter

Reading

Date

Business Rules

After Saving

Update Dashboard

Update Reports

Update Billing

Update Recent Readings

Update Analytics

Generate Audit Log

---

## Upload CSV

POST

/api/readings/upload

Workflow

Validate CSV

↓

Map Flat Number

↓

Find Resident

↓

Find Meter

↓

Save Reading

↓

Update Usage

↓

Update Reports

↓

Update Dashboard

↓

Update Billing

↓

Audit Log

---

# Billing APIs

## Generate Bills

POST

/api/billing/generate

Parameters

Community

Resident

Building

Start Date

End Date

Billing Type

Monthly

Weekly

Custom

Creates

Bills

Invoices

Audit Logs

---

## Get Bills

GET

/api/billing

Supports

Resident

Status

Date

Community

---

## Pay Bill

POST

/api/billing/pay

Updates

Payment Status

Invoice

Reports

Dashboard

---

# Invoice APIs

## Get Invoices

GET

/api/invoices

---

## Generate Invoice

POST

/api/invoices

Creates

Invoice PDF

Updates Reports

---

## Download Invoice

GET

/api/invoices/{id}/download

Returns PDF

---

# Reports APIs

## Dashboard Report

GET

/api/reports/dashboard

---

## Billing Report

GET

/api/reports/billing

---

## Revenue Report

GET

/api/reports/revenue

---

## Water Usage Report

GET

/api/reports/usage

---

## Community Report

GET

/api/reports/community

---

## Resident Report

GET

/api/reports/resident

---

## Export PDF

GET

/api/reports/pdf

---

## Export Excel

GET

/api/reports/excel

---

## Export CSV

GET

/api/reports/csv

---

# Water Purchase APIs

## Get Purchases

GET

/api/water-purchase

---

## Add Purchase

POST

/api/water-purchase

Request

Supplier

Invoice Number

Purchase Date

Tanker Number

Litres

Rate

Cost

Remarks

Business Rules

Update Dashboard

Update Reports

Update Community Statistics

Generate Audit Log

---

## Purchase History

GET

/api/water-purchase/history

---

# Announcement APIs

## Publish Announcement

POST

/api/announcements

Fields

Title

Message

Priority

Audience

Publish Date

Business Rules

Notify Residents

Resident Dashboard

Unread Badge

Audit Log

---

## Get Announcements

GET

/api/announcements

---

## Mark Read

PUT

/api/announcements/{id}/read

---

# Audit APIs

## Get Logs

GET

/api/audit

Supports

User

Role

Date

Module

Action

Status

---

## Export Logs

GET

/api/audit/export

CSV

Excel

PDF

---

# Dashboard APIs

## Super Admin Dashboard

GET

/api/dashboard/super-admin

---

## Community Admin Dashboard

GET

/api/dashboard/community-admin

---

## Resident Dashboard

GET

/api/dashboard/resident

---

# Security Rules

Every endpoint

Must Validate JWT

Must Validate Role

Must Validate Input

Must Return Meaningful Errors

Must Generate Audit Logs where applicable

---

# HTTP Status Codes

200 Success

201 Created

204 Deleted

400 Validation Error

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Invalid Data

500 Internal Server Error

---

# Future APIs

IoT Devices

Leak Detection

Rainwater Harvesting

SMS

Email

AI Prediction

UPI Payments

Mobile App