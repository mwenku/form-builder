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

- `VITE_API_URL=/api` (baked into nginx build arg — default in compose)
- `CORS_ORIGIN` to your public site origin if needed

## Domain

Assign your domain in Dokploy (Traefik handles routing). The `nginx` service serves the React app and proxies `/api/*` to the Go API.

## First deploy checklist

1. Connect GitHub repository
2. Paste environment variables
3. Deploy
4. Verify `https://<your-domain>/api/health` returns `{"status":"ok"}`
5. Open the site root and submit a seeded form

## Local parity

```bash
make compose-up
```

Open http://localhost:8081 (nginx maps host 8081 → container 80).
