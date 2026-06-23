# Dynamic Form Builder Engine

Configuration-driven forms: JSON Schema in PostgreSQL, runtime validation in Go, dynamic React rendering.

## For reviewers

**Fastest path:** [live demo](https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground) — no install.

**Local (one command):**

```bash
make reviewer
```

Then open http://localhost:9999/playground and:

1. Load a template (contact or feedback)
2. Edit fields in **UI** mode or raw **JSON**
3. **Publish new form** (or a new version of an existing form)
4. Fill it out, then use **View history** on the form list

No SQL, migrations, or seed edits required.

## Quick start

### macOS / Linux

```bash
git clone <repo-url>
cd open_ownership_project
make setup
make dev
```

- API: http://localhost:8080  
- Web (Vite): http://localhost:5173  

### Windows

```bat
git clone <repo-url>
cd open_ownership_project
scripts\setup.bat
scripts\dev.bat
```

Requires Docker Desktop, Go 1.22+, Node 20+, and Git.

## Makefile commands

| Command | Purpose |
|---------|---------|
| `make reviewer` | Full stack + printed URLs for trying the Playground |
| `make setup` | First-time install, env, Docker (postgres + api), typegen |
| `make dev` | Start API containers + Vite dev server |
| `make ci` | Code quality: types, format, lint, build, test |
| `make compose-up` | Full stack with nginx (Dokploy parity) → http://localhost:9999 |
| `make dokploy-env` | Print env vars for Dokploy |

## How it works

1. **Form configs** live in `form_configs` as JSON Schema + optional `ui_schema`.
2. The **web app** fetches a config and renders fields dynamically.
3. On submit, the **Go API** validates the payload with **Zog** (compiled from stored JSON Schema).
4. **Submissions** are stored with `form_config_version` pinned for historical integrity.

Try **Version history** on the Contact form to see a seeded v1 submission after v2 added a required phone field.

Use the **Playground** (`/playground`) to publish new forms or schema versions without touching SQL.

## Data model

```
form_configs (id, version) PK
  - title, description, schema jsonb, ui_schema jsonb

form_submissions
  - form_config_id + form_config_version → FK to form_configs
  - answers jsonb
```

New form versions are new rows. Submissions never change their pinned version.

## Validation strategy

Rules live in stored JSON Schema. The API compiles schemas with [Zog](https://github.com/Oudwins/zog) at request time. Invalid payloads return `400` with `{ "errors": [{ "field", "message" }] }`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/forms` | List active forms (`?archived=true` includes archived) |
| POST | `/forms` | Create form (version 1) |
| GET | `/forms/{id}` | Latest config (active forms only) |
| DELETE | `/forms/{id}` | Permanently delete form and all responses |
| POST | `/forms/{id}/archive` | Hide form from list; block new responses |
| POST | `/forms/{id}/restore` | Restore archived form |
| POST | `/forms/{id}/versions` | Publish new schema version |
| GET | `/forms/{id}/submissions` | List all responses (newest first) |
| GET | `/forms/{id}/integrity` | Versions + submissions by version |
| POST | `/forms/{id}/submissions` | Validate + store |

## Tech stack

- **API:** Go, gorilla/mux, pgx, goose, Zog  
- **Web:** React, Vite, TypeScript, React Query, Recoil, react-helmet-async  
- **Types:** typeshare (Go structs → `apps/web/src/generated/api-types.ts`)

## Repository layout

```
apps/
  api/    # Go REST API
  web/    # React + Vite frontend
deploy/   # nginx + Dokploy docs
scripts/  # Windows setup helpers
```  
- **Quality:** Prettier, ESLint, golangci-lint, Husky, GitHub Actions  
- **Deploy:** Docker Compose via Dokploy  

## CI vs deploy

- **CI (GitHub Actions):** `make ci` — code quality only  
- **Deploy:** Dokploy webhook on push to `main` — see [deploy/dokploy.md](deploy/dokploy.md)  

## Trade-offs

- **Single `docker-compose.yml`** for local and Dokploy (no separate prod compose).  
- **No drag-and-drop designer** — use the Playground or seed JSON for new forms.  
- **No auth** — public prototype.  
- **Generated types committed** — drift checked when typeshare is installed.  

### With more time

- Compiled schema cache  
- Managed Postgres (RDS/Neon) instead of container DB  
- Richer Playground (field picker, diff between versions)  

## AI tools

- **Cursor** — scaffolding, boilerplate, tests, README drafts  
- **Verified manually:** validation behaviour, migrations/seed, docker-compose wiring, API contracts  

## Local full stack (nginx)

```bash
make compose-up
```

Open http://localhost:9999 — same layout as Dokploy (`/` static, `/api` proxied).
