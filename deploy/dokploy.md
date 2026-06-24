# Dokploy deployment

## Service settings

| Setting | Value |
|---------|--------|
| Type | Docker Compose |
| Compose path | `docker-compose.yml` |
| Branch | `main` |
| Auto-deploy | On push (recommended) |

## Environment variables

Run locally:

```bash
make dokploy-env
```

Copy the output into the Dokploy Compose **Environment** panel. Use strong values for `POSTGRES_PASSWORD` in production.

For the full stack (web + API + DB), deploy all services in `docker-compose.yml`. Set:

- `VITE_API_URL=/api` (baked into the web build arg)
- `CORS_ORIGIN` to your public site origin

Route traffic with Traefik:

- `/` → `web` service (port **4892**)
- `/api` → `api` service (port **9787**)

## Domain

Assign your domain in Dokploy (Traefik handles routing). The `web` service serves the React app; the `api` service handles `/api/*`.

### Migrating from `nginx` → `web`

If deploy fails with *"Domain … is attached to service nginx which does not exist"*, the domain is still bound to the old service name. In Dokploy:

1. Open your Compose app → **Domains**
2. Remove or edit the domain entry that targets **`nginx`**
3. Add the domain again targeting **`web`** on port **4892**
4. Add a path route: `/api` → **`api`** on port **9787**
5. Redeploy

Production env overrides (in addition to `make dokploy-env` output):

```
VITE_API_URL=/api
CORS_ORIGIN=https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me
```

`VITE_API_URL` is a build arg — trigger a rebuild after changing it.

## First deploy checklist

1. Connect GitHub repository
2. Paste environment variables
3. Configure Traefik path routing (`/` → web, `/api` → api)
4. Deploy
5. Verify `https://<your-domain>/api/health` returns `{"status":"ok"}`
6. Open the site root and submit a seeded form
7. API reference: `https://<your-domain>/api-docs/`

## Local parity

```bash
make compose-up
```

Open http://localhost:9999 (web maps host `APP_PORT` → container `WEB_PORT`). API is at http://localhost:9787.
