# Dynamic Form Builder

Store form layouts as JSON Schema, validate submissions against them at runtime, and render fields dynamically in React.

> The quickest way to see it working is the live demo or `make reviewer`; local dev, API docs, and tests are all documented below.

## Try it

- **Live demo** (deployed on a personal VPS): https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me/playground
- **Local, full stack:** `make reviewer`; or, without make, `docker compose --env-file compose.env -f docker-compose.local.yml up -d --build --remove-orphans`

Then open the **Playground**, load a template, publish it, fill in the form, and view its version history.

## Run locally

**Needs:** Docker is all you need for `make reviewer` (the full-stack path). For local hot-reload dev (`make dev`) you'll also want Go 1.22+, Node 20+, pnpm, and Git.

### With `make` (macOS / Linux / Git Bash)

```bash
git clone https://github.com/mwenku/form-builder.git
cd form-builder
make setup   # first time
make dev     # hot reload → http://localhost:5173
```

| Command | What it does |
|---------|--------------|
| `make dev` | Development (:5173, API proxied through `/api`) |
| `make reviewer` | Full stack (:9999) + printed URLs |
| `make down` | Stop containers |
| `make build` | API docs + web production build |
| `make test` | Go + frontend tests |
| `make ci` | Lint, build, test, drift checks |

Don't have `make`? Install it ([GNU make](https://www.gnu.org/software/make/)), e.g. `brew install make` (macOS), `choco install make` (Windows), or use **Git Bash** / **WSL** which may include it. Or use the direct commands below.

### Without `make`

Run from the repo root.

**First-time setup** (`make setup`):

```bash
corepack enable                                # provides pnpm (or: npm i -g pnpm@latest)
pnpm install
cd apps/api && go mod download && cd ../..
pnpm prepare
cp -n compose.env.example compose.env

docker compose --env-file compose.env up -d --build postgres api

# wait for API (repeat until 200)
curl -sf http://localhost:9787/health

pnpm generate-api-docs                         # optional; also runs on pnpm build
typeshare .                                    # optional, if installed
```

**Development** (`make dev`):

```bash
docker compose --env-file compose.env up -d postgres api
curl -sf http://localhost:9787/health          # wait until ready
pnpm dev                                       # → http://localhost:5173
```

**Full stack** (`make reviewer` / `make compose-up`):

```bash
docker compose --env-file compose.env -f docker-compose.local.yml up -d --build --remove-orphans
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

Health check: `/api/health` on the app port (e.g. `http://localhost:9999/api/health`) → `{"status":"ok"}`. Direct API: `http://localhost:9787/health`.

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

### Where to look in the code

- **Validation engine** (the core idea): `apps/api/internal/validation/`: compiles stored JSON Schema into [Zog](https://github.com/Oudwins/zog) validators per request.
- **HTTP handlers & routes:** `apps/api/internal/handlers/`
- **Database access:** `apps/api/internal/db/store.go`
- **Dynamic form renderer:** `apps/web/src/components/FormRenderer.tsx`
- **Design & publish UI:** `apps/web/src/pages/PlaygroundPage.tsx`

## What I'd change for production

Some things are intentionally out of scope for this prototype. The main things I'd change before calling it production-ready:

- **Auth**: none today; needs accounts, roles, and possibly some kind of multi-tenancy.
- **Validation**: it's a JSON Schema subset (no nested objects, arrays, or `$ref`) and rules recompile on every request; I'd broaden it and cache the compiled rules.
- **Database**: self-hosted Postgres in a container, with migrations and seed running on app boot; I'd move to a managed/serverless DB and a dedicated migration job.
- **Scale**: list endpoints have no pagination, and version publishing has a read-then-insert race that needs a transaction or lock.
- **Observability**: add structured logging, metrics, and tracing; right now 500s aren't even logged.
- **Tests**: only the validation engine and utils are covered; I'd add handler, integration, and end-to-end (Playwright) tests.
- **Submissions review**: submissions are listed as raw data today; charts, summaries, or other visuals would make reviewing responses much easier.
- **Submissions export**: no way to export collected answers yet; CSV/JSON (or similar) download would help when you need to use the data elsewhere i.e some kind of Business Intelligence reporting.
- **UI**: it's a demo; needs an accessibility pass, responsive/cross-browser work, and a real design system instead of hand-rolled CSS.

## Deploy

The live demo runs on Dokploy as Docker Compose (nginx, API, Postgres). Traefik routes the domain to nginx; nginx proxies `/api` to the Go API. See [deploy/dokploy.md](deploy/dokploy.md).
