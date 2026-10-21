# SWPS Hub

An unofficial platform for SWPS University students: course schedules, an exam calendar, and notes and past exams shared by students of every program and year.

> Status: Phases 1 and 2 complete. Not affiliated with or endorsed by SWPS University.

## Features

### Phase 1 – MVP ✅
- Account registration and login (JWT)
- Course catalogue: search, filter by semester, create and join courses
- Course events: lectures, classes, labs, exams and deadlines, with weekly repetition that keeps local time across daylight-saving changes
- Weekly personal calendar and a dashboard of upcoming exams, deadlines and classes
- Calendar export as a private `.ics` feed (Google Calendar, Apple Calendar, Outlook) with a resettable secret link

### Phase 2 – Shared materials ✅
- Courses organised by program (Psychology, Computer Science, Law…) and year of study, persisting across academic years
- Explore page with search across all programs
- Upload past exams, notes, summaries and assignments (up to 25 MB) tagged with their academic year
- Filter by type and year, sort by most helpful or newest, one upvote per student
- Dashboard feed of new materials in your courses

### Next
- Comments on materials, reporting and moderation
- S3-compatible object storage for uploads

### Phase 3 – Production polish
- `@swps.edu.pl` email verification
- Email reminders before exams and deadlines
- Polish / English UI, PWA support
- Public deployment, monitoring and error tracking

## Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Java 25, Spring Boot, Spring Security (JWT), Spring Data JPA, Flyway, springdoc-openapi |
| Storage  | Local disk behind a `FileStorage` interface (swappable for S3) |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS |
| Testing  | JUnit 5, Testcontainers, Vitest, React Testing Library |
| DevOps   | Docker Compose, GitHub Actions |

## Architecture

```
┌──────────────┐   REST / JSON   ┌───────────────────┐   JPA   ┌────────────┐
│ React (Vite) │ ──────────────▶ │ Spring Boot API   │ ──────▶ │ PostgreSQL │
│  TypeScript  │ ◀────────────── │ (JWT, Flyway)     │         └────────────┘
└──────────────┘                 └───────────────────┘
```

The backend is organised by feature (`auth`, `course`, `event`, `calendar`) rather than by layer, so each feature keeps its controller, service, repository and DTOs together. Errors are returned as RFC 9457 problem details, with per-field messages for validation errors.

### Domain model

- **User** – email, password hash, display name, role, calendar feed token
- **Program** – field of study, such as Psychology or Computer Science
- **Course** – a subject in a program and year of study, with code, name, term, lecturer and description; the code is unique within a program
- **Enrollment** – a user joined a course
- **CourseEvent** – lecture / class / lab / exam / deadline with start, end and location
- **Material** – a shared file (past exam, notes, summary…) with its academic year and vote count

### API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register`, `/api/auth/login` | Create an account or log in; returns a JWT |
| `GET` | `/api/users/me` | Current user |
| `GET` | `/api/programs` | Programs with their course counts |
| `GET` `POST` | `/api/courses` | Search courses (`q`, `program`, `year`, `mine`, `page`) or create one |
| `GET` `PUT` | `/api/courses/{id}` | Course details; edit (author or moderator) |
| `PUT` `DELETE` | `/api/courses/{id}/enrollment` | Join or leave a course |
| `GET` `POST` | `/api/courses/{id}/events` | List or add events (`repeatWeeks` for weekly classes) |
| `DELETE` | `/api/events/{id}` | Delete an event (event author, course author or moderator) |
| `GET` `POST` | `/api/courses/{id}/materials` | List materials (`type`, `year`, `sort`) or upload one (multipart) |
| `GET` | `/api/materials/{id}/file` | Download a material |
| `PUT` `DELETE` | `/api/materials/{id}/vote` | Upvote or remove the upvote |
| `DELETE` | `/api/materials/{id}` | Delete a material (uploader or moderator) |
| `GET` | `/api/materials/feed` | Newest materials in joined courses |
| `GET` | `/api/calendar?from=&to=` | Events from all joined courses |
| `GET` `POST` | `/api/calendar/feed`, `/api/calendar/feed/reset` | Private `.ics` feed link; reset it |
| `GET` | `/api/calendar/feeds/{token}.ics` | The iCalendar feed itself (no login, secret token) |

Full interactive documentation: Swagger UI at `/swagger-ui.html` when running the backend locally.

## Project structure

```
backend/            Spring Boot API
frontend/           React + TypeScript client
docker-compose.yml  Local stack (PostgreSQL, API, client)
.github/workflows/  CI pipeline
```

## Getting started

Requirements: Docker, plus Java 25 and Node.js 24 for local development.

### Run everything with Docker

```bash
docker compose --profile app up --build
```

Open http://localhost:3000.

### Local development

```bash
# Terminal 1 – API on :8080 (starts PostgreSQL from compose.yaml automatically)
cd backend && ./mvnw spring-boot:run

# Terminal 2 – client on :5173 with hot reload
cd frontend && npm install && npm run dev
```

API documentation (Swagger UI): http://localhost:8080/swagger-ui.html

### Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | random per start | Base64 key (at least 256 bits) that signs login tokens. **Required in production**; create one with `openssl rand -base64 32`. |
| `STORAGE_DIR` | `./data/uploads` | Where uploaded materials are stored. |
| `SPRING_DATASOURCE_URL`, `_USERNAME`, `_PASSWORD` | local Docker database | PostgreSQL connection. |

### Tests

```bash
cd backend && ./mvnw verify   # integration tests against a real PostgreSQL (Testcontainers)
cd frontend && npm test       # Vitest + React Testing Library
```
