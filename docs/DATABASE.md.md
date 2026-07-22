# HydroBS Database Documentation

---

# Database

PostgreSQL

Database Name

water_monitor_db

---

# Overall Database Flow

Community

↓

Residents

↓

Water Meter

↓

Meter Readings

↓

Water Usage

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

↓

Announcements

---

# Core Entities

## Community

Purpose

Represents one apartment community.

Fields

- id
- communityName
- address
- city
- state
- pincode
- adminId
- createdAt
- updatedAt

Relationship

One Community

↓

Many Residents

One Community

↓

Many Water Purchases

One Community

↓

Many Bills

One Community

↓

Many Reports

---

## Resident

Purpose

Represents one resident.

Fields

- id
- name
- email
- phone
- flatNumber
- building
- wing
- status
- communityId
- meterId
- createdAt

Relationship

Resident

↓

Many Meter Readings

Resident

↓

Many Bills

Resident

↓

Many Notifications

Resident

↓

Many Announcements

Resident

↓

Many Audit Logs

---

## Water Meter

Purpose

Represents one physical meter.

Fields

- meterId
- serialNumber
- residentId
- installationDate
- status

Relationship

One Meter

↓

Many Readings

---

## Meter Reading

Purpose

Stores all water readings.

Fields

- id
- residentId
- meterId
- readingValue
- readingDate
- source

Source

- Manual
- CSV Upload

Business Rules

Every new reading must

✓ Update Resident Dashboard

✓ Update Community Dashboard

✓ Update Reports

✓ Update Billing

✓ Update Recent Readings

✓ Generate Audit Log

---

## Billing

Purpose

Stores generated bills.

Fields

- id
- residentId
- billingStartDate
- billingEndDate
- unitsConsumed
- baseCharge
- maintenanceCharge
- additionalCharge
- tax
- lateFee
- totalAmount
- paymentStatus
- generatedDate

Relationship

One Bill

↓

One Invoice

---

## Invoice

Purpose

Represents printable invoice.

Fields

- invoiceNumber
- billId
- generatedDate
- dueDate
- paymentStatus
- pdfLocation

---

## Water Purchase

Purpose

Stores extra tanker purchases.

Fields

- id
- communityId
- supplierName
- tankerNumber
- litresPurchased
- ratePerLitre
- totalCost
- invoiceNumber
- purchaseDate
- remarks

Business Rules

Every Purchase

must

Update

Community Water Stock

Dashboard

Reports

Analytics

Audit Logs

---

## Announcement

Purpose

Messages from Community Admin.

Fields

- id
- title
- message
- priority
- audience
- sender
- createdAt

Residents

must receive

Unread Status

Read Status

Timestamp

---

## Audit Log

Purpose

Track every action.

Fields

- id
- user
- role
- action
- module
- description
- ipAddress
- timestamp

Generated For

Login

Logout

Resident

Billing

Invoices

Reports

Water Purchase

CSV Upload

Announcements

Settings

---

# Relationships

Community

1

↓

Many

Residents

Residents

1

↓

Many

Meter Readings

Residents

1

↓

Many

Bills

Bills

1

↓

One

Invoice

Community

1

↓

Many

Water Purchases

Community

1

↓

Many

Announcements

Community

1

↓

Many

Audit Logs

---

# CSV Upload Workflow

CSV Upload

↓

Validate CSV

↓

Match Flat Number

↓

Find Resident

↓

Find Meter

↓

Insert Reading

↓

Update Usage

↓

Update Dashboard

↓

Update Reports

↓

Update Billing

↓

Generate Audit Log

---

# Billing Workflow

Meter Reading

↓

Calculate Units

↓

Apply Water Rate

↓

Maintenance Charges

↓

Additional Charges

↓

Tax

↓

Late Fee

↓

Generate Bill

↓

Generate Invoice

↓

Update Reports

---

# Water Purchase Workflow

Community Admin

↓

Add Purchase

↓

Save Purchase

↓

Update Water Availability

↓

Update Reports

↓

Update Dashboard

↓

Generate Audit Log

---

# Announcement Workflow

Community Admin

↓

Draft Message

↓

Choose Audience

↓

Publish

↓

Resident Dashboard

↓

Unread Notification

↓

Read Status

---

# Business Constraints

Every Resident belongs to exactly one Community.

Every Meter belongs to one Resident.

Every Reading belongs to one Meter.

Every Bill belongs to one Resident.

Every Invoice belongs to one Bill.

Every Water Purchase belongs to one Community.

Every Announcement belongs to one Community.

Every Audit Log records exactly one action.

---

# Future Database Modules

Leak Detection

Rainwater Harvesting

AI Prediction

SMS Notifications

Email Notifications

UPI Payments

IoT Devices
