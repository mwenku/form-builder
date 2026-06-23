# Dynamic Form Builder Engine

Store form layouts as JSON Schema, validate submissions at runtime, render fields dynamically in React.

## Try it

**Live demo:** https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground

**Local (full stack):** `make reviewer`, or `docker compose --env-file compose.env up -d --build` without make.

Open http://localhost:9999/playground → load a template → publish → fill the form → view history.

## Run locally

**Needs:** Docker, Go 1.22+, Node 20+, Git.

### With `make` (macOS / Linux / Git Bash)

```bash
git clone <repo-url>
cd open_ownership_project
make setup   # first time
make dev     # hot reload → http://localhost:5173
```

| Command | What it does |
|---------|--------------|
| `make dev` | Development (:5173, API at `/api`) |
| `make reviewer` | Full stack (:9999) + printed URLs |
| `make down` | Stop containers |
| `make build` | API docs + web production build |
| `make test` | Go + frontend tests |
| `make ci` | Lint, build, test, drift checks |

Don't have `make`? Install it ([GNU make](https://www.gnu.org/software/make/)), e.g. `brew install make` (macOS), `choco install make` (Windows), or use **Git Bash** / **WSL** which include it. Or use the direct commands below.

### Without `make`

Run from the repo root.

**First-time setup** (`make setup`):

```bash
corepack enable
pnpm install
cd apps/api && go mod download && cd ../..
pnpm prepare
cp -n compose.env.example compose.env          # Windows: copy compose.env.example compose.env if missing

docker compose --env-file compose.env -f docker-compose.dev.yml up -d --build postgres api

# wait for API (repeat until 200)
curl -sf http://localhost:8080/health

pnpm generate-api-docs                         # optional; also runs on pnpm build
typeshare .                                    # optional, if installed
```

**Development** (`make dev`):

```bash
docker compose --env-file compose.env -f docker-compose.dev.yml up -d postgres api
curl -sf http://localhost:8080/health          # wait until ready
pnpm dev                                       # → http://localhost:5173
```

**Full stack** (`make reviewer` / `make compose-up`):

```bash
docker compose --env-file compose.env up -d --build
```

Open http://localhost:9999/playground, API docs at http://localhost:9999/api-docs/

**Stop** (`make down`):

```bash
docker compose --env-file compose.env down
```

**Build & test** (`make build` / `make test` / `make ci`):

```bash
cd apps/api && go build -o /dev/null ./cmd/server && cd ../..
pnpm build                                     # generates API docs + Vite build

cd apps/api && go test ./... && cd ../..
pnpm test
```

Health check: `/api/health` → `{"status":"ok"}`.

## How it works

1. **Form configs**: `form_configs` table holds JSON Schema + optional `ui_schema` per `(id, version)`.
2. **Dynamic validation**: Go compiles rules from the stored schema with [Zog](https://github.com/Oudwins/zog); no hardcoded field checks.
3. **Submissions**: answers stored as JSONB with `form_config_version` pinned to the schema that validated them.

```
Publish → form_configs row
Fill    → GET /forms/{id} → FormRenderer
Submit  → POST /forms/{id}/submissions → validate → form_submissions row
```

**Version history:** the seeded Contact form has v1 and v2 (v2 adds required `phone`). Old submissions stay linked to the version that accepted them; see `/forms/{id}/integrity`.

**API docs:** [docs/api/index.html](docs/api/index.html) or `/api-docs/` when running. Spec: `docs/api/openapi.yaml`. Generated on `pnpm build` / `make build` (also checked on pre-commit).

## Design & trade-offs

### Why this shape?

- **PostgreSQL + JSONB**: flexible schemas without per-form tables; FK on `(form_config_id, form_config_version)` keeps submissions tied to a real config version.
- **Versioned rows, not updates**: publishing inserts a new `form_configs` row. Submissions never mutate their pinned version.
- **JSON Schema in the DB**: validation rules live in config, compiled at request time. Supports flat objects with `string`, `number`, `boolean` (no nested/array/`$ref` in this prototype).
- **`/api` proxy**: nginx (prod) or Vite (dev) forwards to the Go service; the browser never calls the backend host directly.

### Error handling

| Status | Response |
|--------|----------|
| `400` | `{ "errors": [{ "field", "message" }] }` |
| `404` | `{ "code": "not_found" }` |
| `500` | `{ "code": "internal_error" }` |

The frontend shows per-field errors plus loading/error/success states.

### Architecture decisions & trade-offs

Each row is a deliberate choice for this prototype, what it buys us, and what we'd revisit for production.

| Decision | Why we chose it | Trade-off / production path |
|----------|-----------------|-----------------------------|
| JSONB answers + JSON Schema stored in the DB | New forms need no migrations or per-form tables | Reporting needs JSON queries or ETL; weaker column-level constraints than a typed schema |
| Immutable versioned config rows (insert, never update) | Submissions stay pinned to the exact schema that validated them; full history is preserved | `form_configs` grows unbounded; there are no in-place edits—every change is a new version |
| Custom JSON-Schema-subset validator on top of Zog | Tailored, user-friendly field errors and a predictable supported feature set | Subset only (no nested/array/`$ref`, `integer` is treated as `number`, `date` is a loose regex); rules are compiled per request—needs a cache at scale |
| Validation lives only on the server | Single source of truth; no rule drift between client and server | A network round-trip per submit; no inline "as-you-type" or offline validation |
| Go structs → typeshare-generated TS types as the API contract | One source of truth; drift is caught in CI | Extra codegen step; the generated file is committed and `typeshare` must be installed locally |
| Split `forms` (identity + lifecycle) from `form_configs` (versioned content) | Archive/restore/delete and submission counts without touching version rows | An extra join plus a registration step that must stay in sync with config inserts |
| `/api` same-origin proxy (nginx in prod, Vite in dev) | Browser never targets the API host; no CORS in production | One proxy hop; the in-code CORS layer is effectively unused |
| Migrations + seed run on API startup | Zero-step bootstrap for a single container | Replicas race on boot—real deploys want a dedicated migration job, which is in tension with horizontal scaling |
| Optimistic version publish (read latest, insert `+1`) guarded by the `(id, version)` primary key | No locking; simple at low concurrency | Concurrent publishes race—one wins, the other errors; needs a transaction/lock or serializable retry at scale |
| List endpoints return everything (no pagination) | Simple queries and simple client code | Unbounded result sets as forms and submissions grow |
| React Query for server state + Recoil for form-fill UI state | Clear split; server data is cached and auto-invalidated | A second state library (Recoil, now unmaintained) for a small slice of UI state |
| No auth, single shared DB role | Fast to demo | Needs auth + tenancy before production |
| Playground (JSON/UI editor), not a drag-and-drop designer | Ships the publish pipeline quickly | Less polished authoring UX |

### Scaling further

Schema compile cache, dedicated migration job (decoupled from app boot), paginated list endpoints, managed Postgres, horizontal stateless API containers, auth/tenancy, async submission webhooks, fuller JSON Schema support.

## Deploy

GitHub Actions runs on pull requests only (`make ci` + `docker compose build`). Deploy is separate: Dokploy auto-deploys `main` (see [deploy/dokploy.md](deploy/dokploy.md)). Enable branch protection so merges require CI green.
