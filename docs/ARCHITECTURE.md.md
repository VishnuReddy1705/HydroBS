# HydroBS Architecture

---

# Purpose

This document describes the architecture of HydroBS.

It explains how all modules interact, how data flows through the system, and the design principles that must be followed.

All future development must follow this architecture.

---

# High-Level Architecture

HydroBS uses a three-tier architecture.

```
                +----------------------+
                |   React Frontend     |
                |  (Vite + TypeScript) |
                +----------+-----------+
                           |
                    REST API (JWT)
                           |
                +----------v-----------+
                | Spring Boot Backend  |
                | Controllers/Services |
                +----------+-----------+
                           |
                    JPA / Hibernate
                           |
                +----------v-----------+
                |    PostgreSQL DB     |
                +----------------------+
```

---

# Backend Architecture

```
Controller
     │
     ▼
Service
     │
     ▼
Repository
     │
     ▼
Database
```

Responsibilities

Controllers

- Receive HTTP requests
- Validate input
- Call services
- Return responses

Services

- Business logic
- Validation
- Transactions
- Calculations
- Workflow coordination

Repositories

- Database access
- CRUD operations
- Queries

Entities

- Database models
- JPA relationships

DTOs

- Request models
- Response models

Configurations

- Security
- JWT
- CORS
- Database
- Swagger (future)

---

# Frontend Architecture

```
Pages
   │
Components
   │
Services
   │
API Client
   │
REST Backend
```

Pages

- Dashboard
- Residents
- Communities
- Reports
- Billing
- Water Purchase
- Announcements
- Audit Logs
- Settings

Components

- Cards
- Tables
- Charts
- Forms
- Dialogs
- Navigation
- Filters

Services

- Authentication
- Residents
- Communities
- Billing
- Reports
- Meter Readings
- Announcements

---

# Database Architecture

Main Tables

- users
- communities
- buildings
- flats
- residents
- water_meters
- meter_readings
- bills
- invoices
- water_purchases
- announcements
- notifications
- audit_logs

Relationships

Community
→ Buildings
→ Flats
→ Residents
→ Water Meters
→ Meter Readings

Residents
→ Bills
→ Invoices
→ Notifications

---

# Authentication Flow

```
Login
   │
   ▼
Authentication Controller
   │
   ▼
User Validation
   │
   ▼
JWT Token Generated
   │
   ▼
Frontend Stores Token
   │
   ▼
Protected API Calls
```

Every protected endpoint requires a valid JWT.

Role-based authorization controls access.

---

# Dashboard Data Flow

```
Database
   │
Repositories
   │
Services
   │
Dashboard APIs
   │
Frontend Dashboard
   │
Charts + Cards + Tables
```

Dashboard widgets must always use live data.

---

# Meter Reading Flow

```
Manual Entry / CSV Upload
            │
            ▼
Validation
            │
            ▼
Database
            │
            ▼
Usage Calculation
            │
            ▼
Billing
            │
            ▼
Dashboard
            │
            ▼
Reports
            │
            ▼
Audit Logs
```

---

# Billing Flow

```
Meter Readings
      │
      ▼
Consumption Calculation
      │
      ▼
Tariff Calculation
      │
      ▼
Bill Generation
      │
      ▼
Invoice Creation
      │
      ▼
Resident Dashboard
      │
      ▼
Reports
```

---

# Water Purchase Flow

```
Community Admin
      │
      ▼
Purchase Form
      │
      ▼
Validation
      │
      ▼
Database
      │
      ▼
Community Water Statistics
      │
      ▼
Dashboard
      │
      ▼
Reports
      │
      ▼
Audit Log
```

---

# Announcement Flow

```
Community Admin
      │
      ▼
Create Announcement
      │
      ▼
Database
      │
      ▼
Resident Notifications
      │
      ▼
Dashboard
      │
      ▼
Read Status
      │
      ▼
Audit Log
```

---

# Report Generation Flow

```
Database
   │
Aggregate Data
   │
Charts
   │
Tables
   │
Export (PDF / Excel / CSV)
```

Reports must always use current database data.

---

# Audit Logging Flow

Every important action generates an audit log.

```
User Action
     │
     ▼
Business Logic
     │
     ▼
Audit Service
     │
     ▼
audit_logs Table
```

Audit logs are immutable.

---

# Layer Responsibilities

Presentation Layer

- UI
- Navigation
- User Interaction

Application Layer

- Controllers
- Services
- Validation
- Security

Persistence Layer

- Repositories
- JPA
- PostgreSQL

---

# Package Structure (Backend)

```
controller/
service/
repository/
entity/
dto/
config/
security/
exception/
util/
```

---

# Folder Structure (Frontend)

```
src/
├── pages/
├── components/
├── services/
├── hooks/
├── context/
├── layouts/
├── routes/
├── types/
├── utils/
├── assets/
└── styles/
```

---

# Design Principles

- Separation of Concerns
- Single Responsibility Principle
- Reusable Components
- Layered Architecture
- Dependency Injection
- Stateless REST APIs
- Responsive UI
- Role-Based Security

---

# Coding Standards

- No business logic in controllers
- No database queries in UI
- Services coordinate workflows
- Repositories only access data
- DTOs isolate API models
- Consistent naming conventions
- Reuse existing components where possible

---

# Scalability Guidelines

Future enhancements should integrate without major restructuring.

Planned additions include:

- IoT Smart Meters
- AI Water Usage Prediction
- Leak Detection
- UPI Payments
- Email Notifications
- SMS Alerts
- Mobile Application
- Kubernetes Deployment

---

# Architecture Decision Records (ADR)

Major architectural changes should be documented with:

- Decision
- Context
- Alternatives Considered
- Consequences
- Date
- Author

This helps preserve the reasoning behind important technical decisions.

## Real-Time Architecture

Database

↓

Service

↓

Event Publisher

↓

WebSocket

↓

Frontend

↓

Dashboard Updates