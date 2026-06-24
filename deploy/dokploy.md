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

- `VITE_API_URL=/api` (baked into the nginx build arg, default in compose)
- `CORS_ORIGIN` to your public site origin

The Go API is **not** exposed as a separate public service. Only nginx is routed on your domain; `/api/*` is proxied to the internal `api` container.

## Domain

Assign your domain in Dokploy (Traefik handles routing). The `nginx` service serves the React app and proxies `/api/*` to the Go API on port **9787**.

Production env overrides:

```
VITE_API_URL=/api
CORS_ORIGIN=https://form-builder-app-lmqi0t-feee02-51-81-223-183.traefik.me
```

`VITE_API_URL` is a build arg — trigger a rebuild after changing it.

## First deploy checklist

1. Connect GitHub repository
2. Paste environment variables
3. Assign domain to **`nginx`** on port **80**
4. Deploy
5. Verify `https://<your-domain>/api/health` returns `{"status":"ok"}`
6. Open the site root and submit a seeded form
7. API reference: `https://<your-domain>/api-docs/`

## Local parity

```bash
make compose-up
```

Open http://localhost:9999 (nginx maps host `APP_PORT` → container 80).
