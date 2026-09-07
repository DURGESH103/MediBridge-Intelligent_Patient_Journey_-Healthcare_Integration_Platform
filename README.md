# MediBridge Backend

Intelligent Patient Journey & Healthcare Integration Platform — backend API.

MediBridge connects patient registration, appointments, queue management, consultations, laboratory workflows, notifications, and journey tracking into one coordinated system. At every step the platform can answer three questions for a patient: **Where am I? What have I completed? What's next?**

## Patient Journey

```
Registration → Appointment → Hospital Check-In → Queue → Consultation
   → (Laboratory Test → Report, if required) → Billing → Completed
```

The journey is **computed, not stored** — `GET /api/v1/journeys/appointments/:id` derives the patient's current stage by reading the live state of their appointment, queue entry, consultation, and any lab test requests. This means the journey can never drift out of sync with what's actually happened, and it naturally adapts: a visit with no lab tests skips straight from Consultation to Completed, while one with lab tests routes through Laboratory first. A separate `journey_events` table stores an append-only timeline (used for the "history" view) but never the current status itself.

## Tech Stack

- **Node.js + TypeScript**, Express.js
- **MySQL** (mysql2, parameterized queries, no ORM)
- **Redis** for the real-time queue token counter
- **Socket.IO** for real-time queue, notification, and lab-report events
- **JWT** access tokens + opaque, hashed, rotating refresh tokens
- **Zod** for request validation
- **Jest + Supertest** for integration tests
- **Docker / docker-compose** for local orchestration

## Architecture

Modular monolith — each domain lives in its own `src/modules/<name>` folder with `*.controller.ts` / `*.service.ts` / `*.repository.ts` / `*.routes.ts` / `*.validation.ts` / `*.types.ts`. Business logic lives in services; repositories are the only place SQL is written. This keeps modules loosely coupled today while leaving a clean seam for extracting any one of them into its own service later.

```
src/
  config/         env, MySQL pool, Redis client, logger
  database/       migrations (plain numbered .sql files) + migration runner
  middleware/     auth, RBAC, validation, centralized error handling
  modules/
    auth/         register, login, refresh, logout
    users/        admin-managed staff accounts
    patients/     patient profiles, duplicate detection, search
    doctors/      departments, doctor profiles, weekly availability
    appointments/ booking, slots, reschedule/cancel, status machine
    queue/        check-in, Redis token counter, call-next, live queue
    consultations/diagnosis, prescriptions, lab requests, completion
    laboratory/   sample → processing → report pipeline
    journey/      computed journey state + event timeline
    notifications/in-app (real) + email/SMS (stubbed provider interface)
  sockets/        Socket.IO server + per-module event emitters
  routes/         mounts every module's router under /api/v1
```

### Roles

`ADMIN`, `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `LAB_STAFF`, `BILLING_STAFF`. Every protected route runs through `authenticate` (JWT) then `authorize(...roles)`; ownership checks (a patient can only see their own records, a doctor only their own queue/consultations) are enforced in the controllers.

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A running MySQL 8 server
- A running Redis server

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `DB_PASSWORD`, `JWT_ACCESS_SECRET`, and any other values. See [Environment Variables](#environment-variables) below.

### 3. Install dependencies and create the database

```bash
npm install
```

Create the database itself (the migration runner creates tables, not the database):

```sql
CREATE DATABASE medibridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations

```bash
npm run db:migrate
```

Migrations are plain numbered `.sql` files in `src/database/migrations/`, applied in order and tracked in a `schema_migrations` table — safe to re-run.

### 5. Seed the first admin account

There's no default admin; RBAC requires bootstrapping one:

```bash
npm run db:seed-admin -- admin@yourhospital.com "SomeStrongPassword123"
```

### 6. Run the API

```bash
npm run dev     # ts-node-dev, auto-reload
npm run build && npm start   # compiled production build
```

The API listens on `PORT` (default `5000`) under the prefix `API_PREFIX` (default `/api/v1`).

## Running with Docker

```bash
docker compose up --build
```

This starts MySQL, Redis, and the API together, waits for both dependencies to report healthy, then runs migrations before starting the server. The app reads the rest of its configuration from `.env` (`DB_HOST`/`REDIS_HOST` are overridden to the compose service names automatically).

## Testing

```bash
npm test
```

Tests run against an isolated `medibridge_test` database (dropped and re-migrated before every run — see `tests/globalSetup.js`) and a separate Redis logical DB (`REDIS_DB=1` in `.env.test`), so they never touch your development data. Coverage focuses on the business rules that matter most: duplicate-patient detection, double-booking prevention, slot-grid validation, refresh-token rotation, RBAC/ownership boundaries, Redis-backed token sequencing, and the computed journey's stage transitions (with and without a lab test in the path).

## API Reference

All endpoints are prefixed with `/api/v1`. Every response follows:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [] }
```

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Self-register as a PATIENT (creates user + patient profile) |
| POST | `/auth/login` | Public | Returns an access token + sets an httpOnly refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | Rotates the refresh token, issues a new access token |
| POST | `/auth/logout` | Refresh cookie | Revokes the refresh token |

### Users (`/users`) — ADMIN only
| Method | Path | Description |
|---|---|---|
| POST | `/users` | Create a staff account (DOCTOR/RECEPTIONIST/LAB_STAFF/BILLING_STAFF/ADMIN) |
| GET | `/users` | List users, optional `?role=` filter |
| GET | `/users/:id` | Get a user |
| PATCH | `/users/:id/status` | Activate/deactivate a user |

### Patients (`/patients`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/patients` | ADMIN, RECEPTIONIST | Register a walk-in patient (duplicate-checked by phone+DOB) |
| GET | `/patients/me` | PATIENT | Own profile |
| GET | `/patients/search?q=` | Staff | Search by name/phone/patient code |
| GET | `/patients/:id` | Staff, or PATIENT (own) | Get a patient |
| PATCH | `/patients/:id` | ADMIN, RECEPTIONIST, or PATIENT (own) | Update a patient |

### Departments & Doctors (`/departments`, `/doctors`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/departments` | Any | List departments |
| POST | `/departments` | ADMIN | Create a department |
| POST | `/doctors` | ADMIN | Register a doctor (creates user + doctor profile) |
| GET | `/doctors?departmentId=` | Any | List active doctors |
| GET | `/doctors/me` | DOCTOR | Own profile |
| GET | `/doctors/:id` | Any | Get a doctor |
| PATCH | `/doctors/:id` | ADMIN | Update a doctor |
| GET | `/doctors/:id/availability` | Any | Weekly availability template |
| PUT | `/doctors/:id/availability` | ADMIN, or DOCTOR (own) | Replace weekly availability |

### Appointments (`/appointments`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/appointments/available-slots?doctorId=&date=` | Any | Computed open/booked slots for a day |
| POST | `/appointments` | PATIENT, ADMIN, RECEPTIONIST | Book an appointment |
| GET | `/appointments?patientId=&doctorId=&status=&fromDate=&toDate=` | Any | List (auto-scoped for PATIENT/DOCTOR) |
| GET | `/appointments/:id` | Owner or staff | Get an appointment |
| PATCH | `/appointments/:id/confirm` | ADMIN, RECEPTIONIST | SCHEDULED → CONFIRMED |
| PATCH | `/appointments/:id/cancel` | Owner (patient/doctor) or staff | → CANCELLED |
| PATCH | `/appointments/:id/no-show` | DOCTOR, staff | → NO_SHOW |
| PATCH | `/appointments/:id/reschedule` | Owner or staff | Move to a new open slot |

### Queue (`/queue`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/queue/check-in` | PATIENT (own), staff | Check in, issues the next token (Redis `INCR`) |
| GET | `/queue/doctors/:doctorId` | DOCTOR (own), staff | Full queue list for the day |
| GET | `/queue/doctors/:doctorId/summary` | Any | Currently-serving token + total waiting |
| PATCH | `/queue/doctors/:doctorId/call-next` | DOCTOR (own), staff | Calls the next WAITING token |
| GET | `/queue/entries/:id` | Owner or staff | Position, patients ahead, estimated wait |
| PATCH | `/queue/entries/:id/complete` \| `/skip` \| `/cancel` | Owner/DOCTOR/staff | Queue entry transitions |

### Consultations (`/consultations`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/consultations` | DOCTOR | Start (requires the appointment be CHECKED_IN) |
| GET | `/consultations/:id` | Owner or staff | Get a consultation |
| PATCH | `/consultations/:id` | DOCTOR | Update diagnosis/notes |
| POST | `/consultations/:id/prescriptions` | DOCTOR | Add a prescription |
| GET | `/consultations/:id/prescriptions` | Owner or staff | List prescriptions |
| POST | `/consultations/:id/lab-tests` | DOCTOR | Request a lab test |
| GET | `/consultations/:id/lab-tests` | Owner or staff | List requested tests |
| PATCH | `/consultations/:id/complete` | DOCTOR | Completes; returns `nextStep: 'LABORATORY' \| 'BILLING'` |

### Laboratory (`/laboratory`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/laboratory/pending` | LAB_STAFF, ADMIN | REQUESTED/SAMPLE_COLLECTED/PROCESSING work queue |
| GET | `/laboratory/patients/:patientId` | Owner or staff | A patient's test history |
| GET | `/laboratory/:id` | Owner or staff | Get a request |
| GET | `/laboratory/:id/report` | Owner or staff | Get the completed report |
| PATCH | `/laboratory/:id/collect-sample` | LAB_STAFF, ADMIN | REQUESTED → SAMPLE_COLLECTED |
| PATCH | `/laboratory/:id/start-processing` | LAB_STAFF, ADMIN | → PROCESSING |
| PATCH | `/laboratory/:id/complete` | LAB_STAFF, ADMIN | → COMPLETED, creates the report |

### Journeys (`/journeys`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/journeys/me` | PATIENT | Own current/most relevant journey |
| GET | `/journeys/patients/:patientId` | Owner or staff | Current journey for a patient |
| GET | `/journeys/patients/:patientId/timeline` | Owner or staff | Full event history |
| GET | `/journeys/appointments/:appointmentId` | Owner or staff | Journey for one specific visit |

### Notifications (`/notifications`)
| Method | Path | Description |
|---|---|---|
| GET | `/notifications?page=&pageSize=` | Own notifications |
| GET | `/notifications/unread-count` | Unread count |
| PATCH | `/notifications/:id/read` \| `/read-all` | Mark read |

## Real-Time Events (Socket.IO)

Connect with `auth: { token: <access token> }`. Every authenticated socket auto-joins `user:<userId>` (and `patient:<patientId>` if applicable) so notification-style events reach it without any extra handshake.

| Event | Emitted to | When |
|---|---|---|
| `queue:updated` | `doctor:<doctorId>:queue` (join via `queue:join`, ack'd) | Any queue entry changes for that doctor/day |
| `queue:patient-called` | same | A patient is called in |
| `lab:report-ready` | `patient:<patientId>` | A lab report is completed |
| `notification:new` | `user:<userId>` | Any in-app notification is created |

## Environment Variables

See `.env.example` for the full list. Notable ones:

- `JWT_ACCESS_SECRET` — required, no default; the app refuses to start without it.
- `JWT_REFRESH_EXPIRES_IN_DAYS` — refresh tokens are opaque random strings hashed (SHA-256) before storage, not JWTs, so they can be revoked server-side on logout and are single-use (rotated on every `/auth/refresh`).
- `REDIS_DB` — logical Redis database index; kept separate between dev (`0`) and test (`1`) so test runs never reset a real queue's token counter.
