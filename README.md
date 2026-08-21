# School Portal

A REST API backend for INPS's school management system — a single platform covering admissions, class and subject management, results and report cards, attendance, behavioral and nursery assessments, school communications, and fee/finance operations, with dedicated portals for administrators, teachers, parents, and bursary staff.

Built with **Express 5** and **Prisma 7** on **PostgreSQL**, with **Firebase Authentication** for identity, **Paystack** for payments, **Cloudinary** for file storage, and **Resend** for transactional email.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Domain model](#domain-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API documentation](#api-documentation)
- [API overview](#api-overview)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

### Admin portal
- Staff and student CRUD, admission, and record management
- Class, section, and subject management, including bulk-assigning subjects to a class
- Subject assignment and scheduling (teacher ↔ subject ↔ class ↔ term)
- Class teacher assignment
- Student enrollment with a pending-buffer pool for review before confirmation
- School configuration — grading thresholds, academic sessions/terms, school calendar, holidays
- Results oversight and verification across classes
- School-wide communications (newsletters/announcements) with drafting, publishing, targeted audiences (parents, staff, or all), and per-recipient read tracking
- Global search across staff, students, and other records

### Teacher portal
- Score entry (CA1, CA2, exam) and computed results
- Attendance marking
- Behavioral ratings (1–5 scale across traits such as punctuality, self-control, and leadership) for primary levels
- Nursery assessments (Yes/No/Sometimes ratings across reading, number work, writing, and social/intellectual development)
- A consolidated "pending tasks" view of outstanding work

### Parent portal
- View child/student profile(s), results, and report cards
- View and pay school fees via Paystack
- Account and password management

### Bursary / finance portal
- Invoices, payments, and bills — issued per student, per class, or school-wide
- Expense and income tracking
- Book price management
- Paystack webhook handling with signature verification

### Platform-wide
- Firebase-backed authentication for staff and parents, with role-based access control
- Server-computed grading (A/C/P/F) from CA1 + CA2 + exam scores
- Auto-generated admission numbers and staff IDs
- Email notifications (account creation, password reset, fee payment confirmation, result notifications) via branded HTML templates
- File uploads (passport photos, admission documents, communication attachments) via Cloudinary
- Postgres-backed rate limiting that stays consistent across multiple server instances
- Structured logging and request tracing
- OpenAPI/Swagger documentation generated from route-level JSDoc

### Planned
- Storekeeper portal and inventory workflows (suppliers, stock in/out) — the database schema and role guard already exist; API routes are not yet implemented.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Web framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 (via Prisma Postgres / Accelerate) |
| Authentication | Firebase Authentication (`firebase`, `firebase-admin`) |
| Validation | Zod |
| Payments | Paystack |
| Email | Resend |
| File storage | Cloudinary |
| Logging | Winston + custom request logger |
| API docs | swagger-jsdoc + swagger-ui-express |
| Testing | Jest + Supertest |
| CI | GitHub Actions |

## Project structure

```
School_portal/
├── admin_portal/        Admin routes/controllers — staff, students, classes, subjects,
│                         assignments, schedules, results, enrollment, config, communications, search
├── auth/                 Staff authentication (login, refresh, password change, "me")
├── bursary_portal/       Finance routes/controllers — invoices, payments, bills, expenses, income
├── parent_portal/        Parent-facing routes/controllers — student profile, fees/payments
├── teacher_portal/       Teacher-facing routes/controllers — results, attendance, behavioral
│                         ratings, nursery assessments, pending tasks
├── store_keeper/         Reserved for the inventory/storekeeper portal (not yet implemented)
├── shared/                Repositories shared across portals (academic, auth, communication, etc.)
├── middleware/            Auth guards, role guards, rate limiting, validation, error handling
├── config/                Swagger setup, startup environment validation
├── lib/                   Prisma client singleton, Firebase Admin SDK init
├── utils/                 Grading, enums, Paystack, Resend, Cloudinary, ID generation, logging, etc.
├── templates/             HTML email templates
├── prisma/                Prisma schema and migrations
├── __tests__/             Jest unit and integration tests
├── app.js                 Express app and route wiring
├── server.js              Entrypoint — DB connection, graceful shutdown
└── seed.js                Database seed script (initial admins, counters, traits, etc.)
```

## Domain model

The schema (`prisma/schema.prisma`) models a single school (no multi-tenancy). Key entities:

- **People:** `Staff`, `Parent`, `Student`
- **Structure:** `Class`, `Section`, `Subject`, `SubjectLevel`, `ClassSubject`, `SubjectAssignment`, `Schedule`, `Enrollment`
- **Academic calendar:** `AcademicSession`, `AcademicTerm`, `SchoolConfiguration`, `SchoolCalendar`, `Holiday`
- **Assessment:** `Result`, `StudentTermRemark`, `Attendance`, `BehavioralTrait`, `BehavioralRating`, `NurseryAssessmentItem`, `NurseryAssessment`
- **Finance:** `Bill`, `BillClass`, `BillStudent`, `Invoice`, `Payment`, `BookPrice`, `Expense`, `IncomeRecord`
- **Communications:** `Communication`, `CommunicationRead`
- **Operations:** `PromotionRun`, `PromotionLog`, `Counter`, `RateLimitHit`
- **Inventory (schema-ready, not yet exposed via API):** `Supplier`, `InventoryItem`, `StockIn`, `StockOut`

**Grading:** results are computed from `CA1 (max 30) + CA2 (max 30) + Exam (max 40) = 100`, mapped to letter grades — A (Distinction, 90+), C (Credit, 70–89), P (Pass, 55–69), F (Fail, below 55).

**Roles:** `TEACHER`, `HEAD_TEACHER`, `ADMIN`, `BURSARY`, `SUPPORT`, and `STOREKEEPER` (reserved), plus a separate `Parent` identity. Whether a `TEACHER` acts as a class (classroom) teacher, a subject teacher, or both is determined by their `Section`/`SubjectAssignment` records, not by a separate role.

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (this project is set up for Prisma Postgres/Accelerate, but any Postgres instance reachable via `DATABASE_URL` works)
- A Firebase project with Authentication enabled, and a service account key
- Accounts for Paystack, Resend, and Cloudinary if you want those features enabled locally

### Setup

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/INPS2026/School_portal.git
   cd School_portal
   npm install
   ```

   `npm install` automatically runs `prisma generate` via the `postinstall` script.

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in the values described in [Environment variables](#environment-variables) below.

3. **Run database migrations**

   ```bash
   npx prisma migrate deploy
   ```

4. **Seed initial data**

   ```bash
   npm run seed
   ```

   This creates the first admin accounts (from `ADMIN_1_*` / `ADMIN_2_*` env vars — default password is the phone number, digits only), plus baseline counters, subjects, behavioral traits, and nursery assessment items. You can create up to 10 admin accounts total.

5. **Start the server**

   ```bash
   npm run dev     # with nodemon, for local development
   npm start       # production
   ```

   By default the API listens on `http://localhost:3000` (configurable via `PORT`).

## Environment variables

Defined in `.env.example`.

**Required** — the server validates these on boot and exits immediately if any are missing:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma Postgres/Accelerate URL) |
| `SERVICE_ACCOUNT_KEY` | Firebase service account credentials (for `firebase-admin`) |
| `FIREBASE_API_KEY` | Firebase client API key |

**Recommended** — the server still starts without these, but the related features degrade (log a warning, then fail at request time):

| Variable | Purpose |
|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack API secret key |
| `PAYSTACK_CALLBACK_URL` | Paystack payment callback URL |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_FROM` | Sender address for outgoing email |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_URL` | Cloudinary connection URL |

**Optional:**

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on (defaults to `3000`) |
| `CORS_ORIGIN` | Allowed CORS origin (defaults to `*`) |
| `BASE_URL` | Public base URL of the API |
| `RENDER_EXTERNAL_URL` | External URL when deployed on Render |
| `SCHOOL_PHONE` | School contact phone, used in email templates |
| `SCHOOL_WEBSITE` | School website, used in email templates |

**Seed data** (used only by `npm run seed`):

| Variable | Purpose |
|---|---|
| `ADMIN_1_EMAIL` / `ADMIN_1_PHONE` | First seeded admin account |
| `ADMIN_2_EMAIL` / `ADMIN_2_PHONE` | Second seeded admin account |

## Available scripts

| Script | Description |
|---|---|
| `npm start` | Start the server (`node server.js`) |
| `npm run dev` | Start the server with nodemon for local development |
| `npm run seed` | Seed the database with initial admins, counters, subjects, behavioral traits, and nursery items |
| `npm test` | Run the full Jest test suite |
| `npm run test:unit` | Run unit tests only (`__tests__/unit`) |
| `npm run test:integration` | Run integration tests only (`__tests__/integration`) — requires a live database and Firebase project |

## API documentation

Interactive OpenAPI/Swagger documentation is generated from JSDoc annotations on the route files (`config/swagger.js`) and served at:

```
GET /api-docs
```

when the server is running.

## API overview

All routes are mounted under `/api`. Selected top-level route groups (see `app.js`):

| Base path | Portal | Covers |
|---|---|---|
| `/api/staff` | Auth | Staff login, token refresh, password change, current user |
| `/api/admin/staff` | Admin | Staff management |
| `/api/admin/students` | Admin | Student management |
| `/api/admin/config` | Admin | School configuration, sessions/terms, calendar |
| `/api/admin/subjects` | Admin | Subjects and class-subject links |
| `/api/admin/assignments` | Admin | Subject/teacher assignments |
| `/api/admin/schedules` | Admin | Class schedules |
| `/api/admin/results` | Admin | Results oversight |
| `/api/admin/classes` | Admin | Classes, sections, class teacher assignment |
| `/api/admin/enrollment` | Admin | Student enrollment |
| `/api/admin/communications` | Admin | Newsletters/announcements |
| `/api/search` | Admin | Global search |
| `/api/finance` | Bursary | Invoices, payments, bills, expenses, income, book prices |
| `/api/teacher/students` | Teacher | Roster and student data |
| `/api/teacher/results` | Teacher | Score entry and results |
| `/api/parent` | Parent | Student/child profile |
| `/api/parent/fees` | Parent | Fees and payments |
| `/api/health` | — | Database connectivity health check |

Full request/response schemas and per-endpoint details are available via [Swagger](#api-documentation) rather than duplicated here, so they stay in sync with the code.

## Authentication

Authentication is handled by **Firebase Authentication** rather than local password storage:

- Clients authenticate against Firebase and obtain an ID token.
- The ID token is sent as a `Bearer` token in the `Authorization` header on API requests.
- `middleware/authenticate.js` verifies staff tokens via `firebase-admin` and resolves the corresponding `Staff` record (matched by `firebaseUid`); `middleware/authenticateParent.js` does the same for parents.
- Role-based access is enforced with dedicated guards (`requireAdmin`, `requireTeacher`, `requireBursary`, `requireClassTeacher`, `requireStorekeeper`, `requireRoles`).
- Login attempts are rate-limited separately from general API traffic (`middleware/loginLimiter.js`).

## Testing

Tests are written with **Jest** and **Supertest**, split into two suites:

- `__tests__/unit/` — pure logic (grading, enums, error handling, invoice status, etc.), no external dependencies
- `__tests__/integration/` — exercises real routes against a live PostgreSQL database and Firebase project (auth, enrollment, health checks, 404 handling)

```bash
npm run test:unit          # safe to run anywhere, no external services required
npm run test:integration   # requires a configured .env pointing at a real database/Firebase project
npm test                   # run everything
```

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `main`, using Node 20 and `npm run test:unit`. Integration tests are not run in CI, since no test database or Firebase project is currently provisioned there — run them locally against your own `.env`.

## Deployment

The app is designed to run behind a single reverse-proxy hop (`app.set("trust proxy", 1)` in `app.js`), which matches a [Render](https://render.com) deployment — evidenced by the `RENDER_EXTERNAL_URL` environment variable. It should work on any Node host that terminates TLS and forwards `X-Forwarded-For` correctly; adjust the trust-proxy setting if your deployment topology differs.

Typical production boot sequence:

1. `npm install` (runs `prisma generate`)
2. `npx prisma migrate deploy`
3. `npm start`

`server.js` establishes the database connection on boot and handles graceful shutdown on termination signals.
