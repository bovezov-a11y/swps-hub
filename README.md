# SWPS Student Hub

A platform for SWPS University students: course schedules, exam calendar and shared study notes, in one place.

> Status: early development (Phase 1 – MVP)

## Features

### Phase 1 – MVP
- Account registration and login (JWT)
- Course catalogue: browse, create and join courses
- Course events: lectures, labs, exams and deadlines
- Personal calendar built from the courses you joined
- Calendar export as a private `.ics` feed (Google Calendar, Apple Calendar, Outlook)

### Phase 2 – Notes sharing
- Upload notes and past exam materials per course (S3-compatible storage)
- Upvotes, comments and full-text search
- Moderation (report / hide content)

### Phase 3 – Production polish
- `@swps.edu.pl` email verification
- Email reminders before exams and deadlines
- Polish / English UI, PWA support
- Public deployment, monitoring and error tracking

## Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Java 25, Spring Boot, Spring Security (JWT), Spring Data JPA, Flyway, springdoc-openapi |
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

The backend is organised by feature (`auth`, `course`, `event`, `calendar`) rather than by layer, so each feature keeps its controller, service, repository and DTOs together.

### Domain model (Phase 1)

- **User** – email, password hash, display name, role
- **Course** – code, name, semester, lecturer
- **Enrollment** – a user joined a course
- **CourseEvent** – lecture / lab / exam / deadline with start, end and location

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

### Tests

```bash
cd backend && ./mvnw verify   # integration tests against a real PostgreSQL (Testcontainers)
cd frontend && npm test       # Vitest + React Testing Library
```
