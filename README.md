# SWPS Hub

[![CI](https://github.com/bovezov-a11y/swps-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/bovezov-a11y/swps-hub/actions/workflows/ci.yml)

An unofficial platform for SWPS University students: course schedules, an exam calendar, and notes and past exams shared by students of every program and year.

> Status: Phases 1–4 complete. Not affiliated with or endorsed by SWPS University.

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

### Phase 3 – Trust and AI study tools ✅
- Sign-up limited to SWPS addresses (`@st.swps.edu.pl`, `@swps.edu.pl`) with one-time email confirmation links
- Privacy by default: shared files are anonymous, other students only ever see totals, and a versioned privacy policy is accepted at sign-up
- AI summaries and practice quizzes for shared PDFs, images and text files, generated with Claude, stored once and shared by every student, with a daily limit per student

### Phase 4 – Learning, community and university tools ✅
- **Syllabus import:** upload a course syllabus and Claude lists its exams, deadlines and grade weights; students check and correct them before they are added to the course calendar
- **Flashcards with spaced repetition (SM-2):** shared decks per course, private progress, daily streak, keyboard-driven flip-card study; Claude can turn any shared PDF into a deck
- **Anonymous Q&A per course:** ask, answer, upvote, and the asker accepts the best answer; names are never shown
- **Study groups:** capacity-limited groups per course; only members see who is in a group and where it meets
- **Workload & wellbeing:** a 16-week heatmap of your exams and deadlines, crunch-week alerts, one-click study plans that land in your calendar and `.ics` feed, a focus timer and Polish support lines
- **Moderation:** anonymous reports, auto-hide after 3 reports, a moderator queue (hide, restore, delete) with an audit log; admins appoint moderators
- **University insights for staff:** assessment heatmap per program, crunch weeks, courses with no materials, unanswered questions. Aggregate only: any figure based on fewer than 5 students is withheld (k-anonymity)

### Next
- S3-compatible object storage for uploads
- Email reminders before exams and deadlines
- Polish / English UI, PWA support
- Public deployment, monitoring and error tracking

## Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Java 25, Spring Boot, Spring Security (JWT), Spring Data JPA, Flyway, springdoc-openapi |
| Storage  | Local disk behind a `FileStorage` interface (swappable for S3) |
| AI       | Claude (`claude-opus-5-5`) via the Anthropic Java SDK, structured outputs |
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
- **Question / Answer** – anonymous course Q&A with votes and an accepted answer
- **StudyGroup** – a capacity-limited group in a course, with its members
- **FlashcardDeck / Flashcard / CardProgress** – shared decks; each student's SM-2 schedule per card
- **StudySession** – personal study time planned before an exam
- **Report / ModerationAction** – anonymous reports and the moderation audit log

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
| `GET` `POST` | `/api/courses/{id}/questions` | List (`filter`, `sort`) or ask questions |
| `GET` `DELETE` | `/api/questions/{id}` | A question with its answers; delete it |
| `POST` | `/api/questions/{id}/answers` | Answer a question |
| `PUT` `DELETE` | `/api/questions/{id}/accepted-answer` | Accept an answer (asker only) |
| `PUT` `DELETE` | `/api/questions/{id}/vote`, `/api/answers/{id}/vote` | Upvote or remove the upvote |
| `GET` `POST` | `/api/courses/{id}/groups` | List or start study groups |
| `PUT` `DELETE` | `/api/groups/{id}/membership` | Join or leave a group |
| `GET` `POST` | `/api/courses/{id}/decks` | List flashcard decks with due counts, or create one |
| `GET` | `/api/decks/{id}/study` | Cards due now, then new ones |
| `POST` | `/api/cards/{id}/reviews` | Grade a card (`AGAIN`, `HARD`, `GOOD`, `EASY`) |
| `POST` | `/api/courses/{id}/ai/syllabus` | Read exams and deadlines from a syllabus file (multipart; nothing is saved) |
| `POST` | `/api/materials/{id}/ai/flashcards` | Turn a material into a flashcard deck with Claude |
| `GET` | `/api/me/learning`, `/api/me/workload` | Flashcard streak; personal workload and crunch weeks |
| `POST` | `/api/me/study-plans` | Plan study sessions before an exam |
| `POST` | `/api/reports` | Report content anonymously |
| `GET` `POST` | `/api/moderation/queue`, `/api/moderation/{type}/{id}/hide` … | Moderator queue and actions (moderators) |
| `GET` `POST` | `/api/admin/moderators` | Appoint or remove moderators (admins) |
| `GET` | `/api/insights` | Aggregate university insights (admins) |

Full interactive documentation: Swagger UI at `/swagger-ui.html` when running the backend locally.

## Project structure

```
backend/            Spring Boot API
frontend/           React + TypeScript client
compose.yaml        Local stack (PostgreSQL, Mailpit, API, client)
.github/workflows/  CI pipeline
```

## Getting started

Requirements: Docker, plus Java 25 and Node.js 24 for local development.

### Run everything with Docker

```bash
docker compose --profile app up --build
```

Open http://localhost:3000. Emails the app sends (such as confirmation links) land in Mailpit at http://localhost:8025.

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
| `ANTHROPIC_API_KEY` | unset | Turns on AI summaries, quizzes and flashcards. Without it the AI buttons are hidden. |
| `ADMIN_EMAILS` | unset | Comma-separated emails that get the admin role when they sign in. Admins appoint moderators in the app. |
| `SHOW_UPLOADER_NAMES` | `false` | Show other students who shared each file. Off keeps sharing anonymous. |
| `PUBLIC_URL` | `http://localhost:5173` | Base URL of the web app, used in email links. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | local Mailpit | SMTP server for confirmation emails. |
| `SPRING_DATASOURCE_URL`, `_USERNAME`, `_PASSWORD` | local Docker database | PostgreSQL connection. |

### Updating the privacy policy

The policy text lives in [`frontend/src/content/privacy-policy.ts`](frontend/src/content/privacy-policy.ts). To change it, edit the text, raise its `version` and `lastUpdated`, and set the same version in `app.privacy.policy-version` in `backend/src/main/resources/application.yml`. Every account stores the version it accepted.

### Tests

```bash
cd backend && ./mvnw verify   # integration tests against a real PostgreSQL (Testcontainers)
cd frontend && npm test       # Vitest + React Testing Library
```

### Demo video

`scripts/demo-video` records a narrated walkthrough of every feature with Playwright, on an isolated copy of the app (port 3100, its own database) filled with made-up students and data. The AI scenes use sample results stored by the seed script, so no API key is needed.

```bash
docker compose --profile app build              # images the demo stack runs
cd scripts/demo-video && npm install && npx playwright install chromium
./reset.sh && node record.mjs                    # writes out/swps-hub-demo.mp4
```
