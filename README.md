# Dynamic Form Builder

Store form layouts as JSON Schema, validate submissions against them at runtime, and render fields dynamically in React. Form designers use the **Playground** to draft schemas, publish versions, and share fill links; respondents submit answers that are validated server-side and pinned to the schema version that accepted them.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Tools Used](#tools-used)
- [Architecture](#architecture)
- [Form Version Flow](#form-version-flow)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Local Development](#local-development)
- [Seed Data](#seed-data)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)
- [Trade-offs & Future Improvements](#trade-offs--future-improvements)

---

## Overview

The project demonstrates a schema-driven form platform: **form configs** (JSON Schema + optional UI hints) live in PostgreSQL, the Go API compiles validation rules from the stored schema on each request, and the React frontend renders whatever fields the schema describes — no hardcoded forms in application code.

**Capabilities today**

| Actor | What they can do |
|---|---|
| Designer | Create forms in the Playground, publish new schema versions, archive/restore forms |
| Respondent | Open a share link, fill the latest active schema, submit answers |
| Reviewer | List submissions, inspect version history and which schema accepted each answer |

There is no authentication layer yet; all endpoints are open. See [Trade-offs & Future Improvements](#trade-offs--future-improvements) for what would change in production.

---

## Live Demo

| Service | URL |
|---|---|
| App (Playground) | [https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground](https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground) |

Health check: `GET /api/health` → `{"status":"ok"}`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.22, [Gorilla Mux](https://github.com/gorilla/mux), [pgx v5](https://github.com/jackc/pgx), [goose](https://github.com/pressly/goose) |
| Validation | [Zog](https://github.com/Oudwins/zog) — rules compiled from stored JSON Schema |
| Database | PostgreSQL 16 |
| Frontend | React 18, Vite 5, TypeScript 5.6, React Router v6, TanStack Query, Recoil |
| Editor | Monaco (JSON schema / UI schema editing in Playground) |
| Shared types | [typeshare](https://github.com/1Password/typeshare) — Go models → TypeScript |
| API docs | OpenAPI 3 (`docs/api/openapi.yaml`), generated Redoc HTML |
| Monorepo | pnpm workspaces |
| Containers | Docker Compose (Postgres, API, Vite dev server) |

---

## Tools Used

| Tool | How it was used |
|---|---|
| VS Code / Cursor | Primary editor for full-stack development |
| Docker | Local Postgres + API + web stack via Compose |
| PgAdmin / psql | Inspecting schema state and ad-hoc queries |
| AI assistants (Claude / Cursor) | Pair-programming — see detail below |

### AI assistance

AI tools were used as a pair-programmer rather than a blind code generator. Specific uses:

- **Scaffolding** — initial monorepo layout, handler wiring, React page shells, and Docker Compose services so structural decisions could be made up-front.
- **Test generation** — table-driven cases in `apps/api/internal/validation/validate_test.go` and frontend unit tests for schema helpers and error formatting; matrices were described in natural language and translated into test code, then reviewed.
- **Debugging** — diagnosing proxy path rewrites, Monaco bundling in Vite, and validation edge cases (e.g. `additionalProperties: false`, E.164 phone patterns).
- **Documentation** — first drafts of the OpenAPI spec, architecture diagram, and this README, edited for accuracy against the running code.

Every generated piece was read, understood, and either accepted, modified, or rejected before being committed. Business rules for schema validation and version pinning were implemented and reviewed by hand.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite)                                          │
│  /  /playground  /forms/:id  /forms/:id/submissions              │
│       /forms/:id/integrity                                       │
│                                                                  │
│  FormRenderer · Playground (Monaco editors) · TanStack Query     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP  /api/*  (Vite proxy in dev)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  Go HTTP Server (Gorilla Mux)                                    │
│                                                                  │
│  middleware: CORS                                                │
│                                                                  │
│  /health              Health check                               │
│  /forms/*             Form CRUD, versions, archive, submissions  │
│         │                                                        │
│     Store (pgx)  →  validation.ValidatePayload (Zog compile)     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ pgx connection pool
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                      │
│  forms · form_configs · form_submissions                         │
└──────────────────────────────────────────────────────────────────┘
```

**Request flow**

```
Publish  →  POST /forms or POST /forms/{id}/versions  →  form_configs row
Fill     →  GET /forms/{id}  →  FormRenderer reads schema + uiSchema
Submit   →  POST /forms/{id}/submissions  →  validate  →  form_submissions row
Review   →  GET /forms/{id}/integrity  →  submissions grouped by pinned version
```

On startup the API runs goose migrations and idempotent seed data (demo forms + one sample submission).

---

## Form Version Flow

Each form is identified by a stable UUID. Schema changes create a **new row** in `form_configs` with an incremented `version`. Submissions store `form_config_version` so answers always reflect the rules that validated them — even after the live schema moves forward.

```
                    ┌─────────────────┐
                    │  Create form    │
                    │  (version 1)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │ publish      │ submissions  │ archive
              │ new version  │ pinned to    │ (soft hide)
              ▼              │ v1, v2, …    ▼
        ┌──────────┐         │         ┌──────────┐
        │  v2, v3… │◄────────┘         │ archived │
        │  latest  │                   │ (404 on  │
        │  served  │                   │  fill)   │
        └──────────┘                   └────┬─────┘
                                            │ restore
                                            ▼
                                       active again
```

**Example:** the seeded Contact form has v1 (name, email, message) and v2 (adds required `phone`). A submission made against v1 remains visible under v1 in the integrity view; new respondents see v2.

Supported JSON Schema subset (flat objects only): `string` (with `format`, `pattern`, `minLength`, `maxLength`), `number` (with `minimum`, `maximum`, `multipleOf`), `boolean`, and `enum`. No nested objects, arrays, or `$ref`.

---

## Project Structure

```
.
├── apps/
│   ├── api/
│   │   ├── cmd/server/main.go              # Entry point: migrate, seed, router, CORS
│   │   ├── internal/
│   │   │   ├── db/
│   │   │   │   ├── store.go                # Queries: forms, versions, submissions, archive
│   │   │   │   └── seed.go                 # Demo Contact + Expense request forms
│   │   │   ├── handlers/
│   │   │   │   ├── handlers.go             # Routes, get/create submission, integrity
│   │   │   │   ├── publish.go              # Create form, publish version
│   │   │   │   └── lifecycle.go            # List submissions, archive, restore, delete
│   │   │   ├── models/forms.go             # Shared types (typeshare → TS)
│   │   │   └── validation/
│   │   │       ├── validate.go             # ValidatePayload — compile Zog per request
│   │   │       ├── json_schema.go          # Supported schema subset parser
│   │   │       ├── schema_definition.go    # Validate schema at publish time
│   │   │       └── validate_test.go
│   │   ├── migrations/
│   │   │   ├── 001_init.sql
│   │   │   ├── 002_improve_form_schemas.sql
│   │   │   └── 003_form_lifecycle.sql
│   │   ├── Dockerfile
│   │   └── go.mod
│   └── web/
│       ├── src/
│       │   ├── api/                          # fetch client, React Query hooks
│       │   ├── components/
│       │   │   ├── FormRenderer.tsx          # Dynamic field rendering from schema
│       │   │   ├── PlaygroundFormPanel.tsx   # Live preview while editing
│       │   │   ├── JsonMonacoEditor.tsx
│       │   │   └── PhoneField.tsx
│       │   ├── pages/
│       │   │   ├── FormListPage.tsx          # Home — all forms
│       │   │   ├── PlaygroundPage.tsx        # Design + publish
│       │   │   ├── FormFillPage.tsx          # Public fill view
│       │   │   ├── SubmissionsPage.tsx       # Raw submission list
│       │   │   └── IntegrityPage.tsx         # Version history + grouped answers
│       │   ├── generated/api-types.ts        # typeshare output
│       │   └── lib/schema.ts                 # Client-side schema helpers
│       ├── vite.config.ts                    # Dev proxy → API
│       └── Dockerfile
├── docs/api/
│   ├── openapi.yaml
│   └── index.html                            # Redoc (also copied to web/public)
├── scripts/generate-api-docs.mjs
├── docker-compose.yml
├── Makefile
└── pnpm-workspace.yaml
```

---

## Database Schema

### `forms`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK — stable form identity |
| `archived_at` | `TIMESTAMPTZ` | `NULL` = active; set by archive |
| `created_at` | `TIMESTAMPTZ` | |

### `form_configs`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | FK → `forms.id` (same UUID across versions) |
| `version` | `INT` | Part of composite PK `(id, version)` |
| `title` | `TEXT` | |
| `description` | `TEXT` | |
| `schema` | `JSONB` | JSON Schema for answers |
| `ui_schema` | `JSONB` | Labels, field order, widgets, placeholders |
| `created_at` | `TIMESTAMPTZ` | |

### `form_submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK, `gen_random_uuid()` |
| `form_config_id` | `UUID` | FK → `form_configs(id, version)` |
| `form_config_version` | `INT` | Pinned schema version |
| `answers` | `JSONB` | Validated payload |
| `created_at` | `TIMESTAMPTZ` | |

> Submissions are immutable once stored. Version changes never rewrite existing answers — integrity is preserved by the `(form_config_id, form_config_version)` foreign key.

---

## API Reference

All routes are served under `/api` in development (Vite proxy strips the prefix). Full spec: [`docs/api/openapi.yaml`](docs/api/openapi.yaml). Interactive docs: `/api-docs/` when running, or [`docs/api/index.html`](docs/api/index.html).

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |

### Forms

| Method | Path | Description |
|---|---|---|
| `GET` | `/forms` | List forms (`?archived=true` includes archived) |
| `POST` | `/forms` | Create form (version 1) |
| `GET` | `/forms/{id}` | Latest active config (404 if archived) |
| `DELETE` | `/forms/{id}` | Delete form, all versions, and submissions |
| `POST` | `/forms/{id}/versions` | Publish new schema version |
| `POST` | `/forms/{id}/archive` | Soft-archive |
| `POST` | `/forms/{id}/restore` | Restore archived form |

**Create form body**

```json
{
  "title": "Contact us",
  "description": "Optional description",
  "schema": {
    "type": "object",
    "required": ["name"],
    "properties": {
      "name": { "type": "string", "minLength": 1 }
    },
    "additionalProperties": false
  },
  "uiSchema": {
    "order": ["name"],
    "labels": { "name": "Full name" }
  }
}
```

### Submissions

| Method | Path | Description |
|---|---|---|
| `GET` | `/forms/{id}/submissions` | All submissions for the form |
| `POST` | `/forms/{id}/submissions` | Validate against latest schema and store |
| `GET` | `/forms/{id}/integrity` | Versions with submissions grouped by pinned version |

**Submit body** — flat JSON object matching the form schema:

```json
{ "name": "Jane Doe", "email": "jane@example.com" }
```

**Validation error format**

```json
{
  "errors": [
    { "field": "email", "message": "Enter a valid email address." }
  ]
}
```

**Generic error format**

```json
{ "code": "not_found" }
```

---

## Local Development

### Prerequisites

- Docker (recommended — runs Postgres, API, and web together)
- For native dev: Go 1.22+, Node 20+, pnpm, Git

### Quick start (Docker)

```bash
git clone <repo-url>
cd open_ownership_project
make setup    # first time: pnpm install + start stack
```

Open [http://localhost:9987/playground](http://localhost:9987/playground). API docs at [http://localhost:9987/api-docs/](http://localhost:9987/api-docs/).

| Command | What it does |
|---|---|
| `make setup` | Install dependencies, start containers, wait for API health |
| `make dev` / `make up` | Start Postgres + API + Vite (hot reload on `apps/web/src`) |
| `make down` | Stop containers |
| `make test` | Go + frontend unit tests |
| `make build` | API compile + generate docs + Vite production build |
| `make ci` | Lint, format, type drift, build, test (matches GitHub Actions) |

Direct API health (bypassing Vite proxy): `http://localhost:9787/health`.

### Native web dev (API in Docker)

```bash
docker compose up -d postgres api
curl -sf http://localhost:9787/health    # wait until ready
pnpm dev                               # → http://localhost:9987
```

### Environment variables

| Variable | Default | Used by |
|---|---|---|
| `POSTGRES_USER` | `formbuilder` | Postgres container |
| `POSTGRES_PASSWORD` | `formbuilder` | Postgres container |
| `POSTGRES_DB` | `formbuilder` | Postgres container |
| `DATABASE_URL` | composed from above | API |
| `API_PORT` | `9787` | API |
| `CORS_ORIGIN` | `http://localhost:9987` | API |
| `WEB_PORT` | `9987` | Web container host port |
| `VITE_PROXY_TARGET` | `http://api:9787` | Web (Compose network) |

The API requires `DATABASE_URL` when run outside Compose.

---

## Seed Data

On first boot (empty `form_configs` table), the API seeds two demo forms:

| Form | ID | Versions | Notes |
|---|---|---|---|
| Contact us | `11111111-1111-1111-1111-111111111111` | v1, v2 | v2 adds required E.164 `phone`; one v1 submission pre-loaded |
| Expense request | `22222222-2222-2222-2222-222222222222` | v1 | Category enum, amount, date, urgent flag |

Seed is idempotent — if any config rows exist, seeding is skipped.

---

## Running Tests

```bash
make test
```

Or individually:

```bash
cd apps/api && go test ./...
pnpm --filter web test
```

Backend tests cover the validation engine (`ValidatePayload`, schema definition checks, edge cases for required fields, email format, enums, and `additionalProperties`). Frontend tests cover schema helpers, phone formatting, publish errors, and API error parsing.

CI (`.github/workflows/ci.yml`) runs `make ci` on every pull request, including typeshare drift checks, API doc drift checks, golangci-lint, and Docker image builds.

---

## Deployment

The live demo runs as Docker Compose on a VPS (Traefik routes HTTPS to the web container; Vite proxy forwards `/api` to the Go service).

**Typical production layout**

1. **PostgreSQL** — managed instance or container with persistent volume.
2. **API** — build from `apps/api/Dockerfile`; set `DATABASE_URL`, `API_PORT`, `CORS_ORIGIN` to the public frontend origin.
3. **Web** — build static assets with `pnpm build`, serve via nginx or similar; proxy `/api` to the API service.

Migrations and seed run automatically when the API starts (`goose.Up` + `db.Seed` in `cmd/server/main.go`).

For a production web image, replace the dev-oriented `apps/web/Dockerfile` (which runs `vite dev`) with a multi-stage build that runs `pnpm build` and serves `dist/`.

---

## Design Decisions

### Schema-driven validation as the single source of truth

`validation.ValidatePayload` parses the stored JSON Schema and compiles [Zog](https://github.com/Oudwins/zog) field validators per request. Adding a field to a form means updating the schema — no handler or model changes. Publish-time checks (`ValidateSchemaDefinition`) reject unsupported constructs before they reach respondents.

### Version pinning on submissions

Each submission stores `form_config_version` with a foreign key to `form_configs(id, version)`. When a designer publishes v2, existing v1 answers are untouched. The integrity endpoint groups submissions by version so reviewers can see exactly which rules applied.

### UI schema separated from validation schema

`ui_schema` holds presentation-only data: field order, labels, widget types (`textarea`, `phone`), placeholders, help text, and enum display labels. The API validates answers against `schema` only; the frontend uses `uiSchema` to render a usable form without polluting the validation contract.

### Shared types via typeshare

Go structs in `apps/api/internal/models/forms.go` carry `//typeshare:typescript` annotations. Running `typeshare .` regenerates `apps/web/src/generated/api-types.ts`, keeping request/response shapes in sync across the stack.

### Migrations + seed on boot

Goose migrations are embedded in the binary (`apps/api/migrations/embed.go`) and applied on startup. Seed data runs once when the database is empty, giving a working demo without manual SQL. In production this pattern would move to a dedicated migration job; for a demo it keeps deployment to a single container start command.

### OpenAPI as the contract

`docs/api/openapi.yaml` is the source of truth for the REST surface. `scripts/generate-api-docs.mjs` produces Redoc HTML checked into the repo and copied to `apps/web/public/api-docs/` on build, so `/api-docs/` works offline and in CI drift checks catch spec regressions.

---

## Trade-offs & Future Improvements

### Trade-offs made

**JSON Schema subset vs full spec**
Only flat objects with primitive fields are supported. This keeps the validation compiler small and testable, but rules out nested structures, conditional schemas, and `$ref`. Full JSON Schema or a dedicated form DSL would be needed for complex registrations.

**Compile-on-every-request vs cached validators**
Validators are rebuilt from the stored schema on each submission. This is simple and always correct when schemas change, but adds CPU overhead. A cache keyed by `(form_id, version)` with invalidation on publish would scale better.

**No authentication**
Every endpoint is public. Fine for a prototype and demo; production needs accounts, roles (designer vs respondent vs admin), and likely multi-tenancy.

**No pagination**
List endpoints return all forms and all submissions. Acceptable at demo scale; a busy deployment would need cursor-based pagination and filtering.

**In-process validation vs DB constraints**
Answer shape is enforced in Go, not by PostgreSQL `CHECK` constraints on `answers` JSONB. The FK on `(form_config_id, form_config_version)` is the main database-level integrity guarantee.

**Dev-oriented web Docker image**
The Compose web service runs Vite in dev mode with volume mounts for hot reload. Production needs a static build + reverse proxy instead.

### What I would add with more time

| Area | Improvement |
|---|---|
| **Auth & roles** | Designer/reviewer accounts; protect publish and submission list endpoints |
| **Validation cache** | Memoize compiled Zog validators per `(id, version)` |
| **Richer schema** | Nested objects, arrays, conditional `required`, `$ref` for reusable blocks |
| **Submission review UI** | Charts, summaries, and filters instead of raw JSON lists |
| **Export** | CSV/JSON download of submissions for BI or compliance |
| **Integration tests** | Full HTTP → handler → repository → Postgres path with testcontainers |
| **Observability** | Structured logging, metrics, and tracing on validation failures and 500s |
| **Optimistic concurrency on publish** | Transaction or advisory lock around read-latest + insert-version to close the race |
| **Accessibility & design system** | Replace hand-rolled CSS with a component library; full a11y audit |
| **E2E tests** | Playwright flow: Playground publish → fill → submit → integrity view |
