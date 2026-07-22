# 💧 HydroBS – Web-Based Water Usage Monitoring & Billing Platform

![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.x-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Overview

HydroBS is a full-stack web application designed to help apartment communities monitor water usage, manage residents, generate bills, purchase water, and analyze consumption through a modern dashboard.

The platform provides dedicated dashboards for:

- Super Admin
- Community Admin
- Residents

HydroBS promotes transparent billing, efficient water management, and data-driven decision making.

---

# ✨ Features

## Authentication

- JWT Authentication
- Role-Based Access Control
- Secure Login
- Secure Registration
- Password Encryption

---

## Community Management

- Community Creation
- Community Dashboard
- Building Management
- Flat Management
- Resident Assignment

---

## Resident Management

- Resident Registration
- Water Meter Assignment
- Usage Tracking
- Bill History
- Invoice History

---

## Meter Readings

- Manual Entry
- CSV Upload
- Validation
- Reading History
- Recent Readings

---

## Billing

- Weekly Billing
- Monthly Billing
- Custom Billing
- Tax Calculation
- Maintenance Charges
- Late Fees
- Invoice Generation

---

## Reports

- Water Usage
- Billing Reports
- Revenue Reports
- Community Statistics
- Resident Statistics
- Export PDF
- Export Excel
- Export CSV

---

## Water Purchase

- Purchase Tracking
- Supplier Management
- Cost Analysis
- Water Stock Updates

---

## Announcements

- Publish Announcements
- Priority Levels
- Audience Selection
- Resident Notifications

---

## Audit Logs

- Login Activity
- CRUD Operations
- Billing Events
- CSV Imports
- Payments
- Reports
- System Changes

---

# 🛠 Technology Stack

Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT
- Maven

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

Database

- PostgreSQL

Tools

- Git
- GitHub
- IntelliJ IDEA
- VS Code
- DBeaver

---

# 📂 Project Structure

```
HydroBS
│
├── backend
├── frontend
├── docs
├── database
├── README.md
└── .antigravity
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone <repository-url>
cd HydroBS
```

## Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🗄 Database

Create a PostgreSQL database.

Example:

```
water_monitor_db
```

Configure:

```
application.properties
```

with

- URL
- Username
- Password
- JWT Secret

---

# 👥 User Roles

### Super Admin

- Manage Communities
- View Global Analytics
- Platform Administration

---

### Community Admin

- Manage Residents
- Upload CSV Readings
- Generate Bills
- Publish Announcements
- Purchase Water

---

### Resident

- View Usage
- View Bills
- Download Invoices
- Read Announcements

---

# 🏗 Architecture

HydroBS follows a three-layer architecture.

```
React Frontend

↓

REST APIs

↓

Spring Boot Backend

↓

PostgreSQL
```

More details are available in:

```
docs/ARCHITECTURE.md
```

---

# 📚 Documentation

Project documentation is available in the `docs/` folder.

- 01_PROJECT_CONTEXT.md
- 02_MASTER_SPEC.md
- 03_DATABASE.md
- 04_API_DOCUMENTATION.md
- 05_UI_DESIGN_GUIDELINES.md
- 06_BUSINESS_RULES.md
- 07_TODO.md
- 08_SESSION.md
- 09_TESTING_CHECKLIST.md
- 10_DEPLOYMENT.md
- ARCHITECTURE.md
- CHANGELOG.md

---

# 🧪 Testing

Before merging any feature, verify:

- Backend Builds
- Frontend Builds
- API Tests
- Dashboard Updates
- Billing
- Reports
- CSV Upload
- Responsive UI

Refer to:

```
docs/09_TESTING_CHECKLIST.md
```

---

# 📈 Future Roadmap

- Leak Detection
- AI Water Prediction
- IoT Smart Meters
- Rainwater Harvesting Credits
- UPI Payments
- Email Notifications
- SMS Alerts
- Mobile Application

---

# 🤝 Contributing

1. Create a feature branch.
2. Follow the project coding standards.
3. Update documentation.
4. Add tests.
5. Update `CHANGELOG.md`.
6. Submit a pull request.

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Om Vishnu Vardhan Reddy**

B.E. Information Science & Engineering

Passionate about Full-Stack Development, AI, and Data Science.

---

# ⭐ Acknowledgements

Built as a full-stack water management platform to demonstrate modern software engineering practices, scalable architecture, and enterprise-grade documentation.