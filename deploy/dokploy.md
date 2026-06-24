# Dokploy deployment

## Service settings

| Setting | Value |
|---------|--------|
| Type | Docker Compose |
| Compose path | `docker-compose.yml` |
| Branch | `main` |
| Auto-deploy | On push (recommended) |

Dokploy runs:

```bash
docker compose -p <project> -f ./docker-compose.yml up -d --build --remove-orphans
```

Only `docker-compose.yml` is used in production. `docker-compose.local.yml` is for local host port mappings and is not deployed.

## Architecture

```
Internet → Traefik (Dokploy) → nginx:80 → static React app
                              → nginx:80 → /api/* → api:9787 → postgres
```

- **nginx** — only public-facing service; assign your domain here
- **api** — internal only (`expose`, no host ports)
- **postgres** — internal only (persistent volume `postgres_data`)

## Environment variables

```bash
make dokploy-env
```

Paste the **production** block into Dokploy → Compose → **Environment**:

| Variable | Production value |
|----------|------------------|
| `POSTGRES_USER` | e.g. `formbuilder` |
| `POSTGRES_PASSWORD` | strong secret |
| `POSTGRES_DB` | e.g. `formbuilder` |
| `API_PORT` | `9787` (must match `deploy/nginx.conf`) |
| `VITE_API_URL` | `/api` |
| `CORS_ORIGIN` | `https://your-domain.com` |

`VITE_API_URL` is a **build arg** — redeploy with rebuild after changing it.

Do **not** set `APP_PORT` on Dokploy; Traefik routes to container port 80 directly.

## Domain

1. Open your Compose app → **Domains**
2. Add domain → service **`nginx`** → container port **80**
3. Enable HTTPS (Let's Encrypt)

No separate Traefik route for `/api` is needed — nginx proxies it internally.

If you previously attached the domain to a removed service, delete that entry and re-add it for **`nginx`**.

## First deploy checklist

1. Connect GitHub repository
2. Paste production environment variables (`make dokploy-env`)
3. Assign domain to **`nginx`** on port **80**
4. Deploy (with build)
5. Wait ~10s for TLS certificates
6. Verify `https://<your-domain>/api/health` → `{"status":"ok"}`
7. Open `https://<your-domain>/playground`
8. API reference: `https://<your-domain>/api-docs/`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Domain attached to `nginx` which does not exist | Re-add domain for service **`nginx`** |
| 502 on `/api/*` | Check `api` container logs; confirm it is healthy |
| Frontend loads but API calls fail | Rebuild after setting `VITE_API_URL=/api` |
| 504 after restart | In Dokploy isolated deployments, add `traefik.docker.network=<your-network>` label via Domains if needed |

## Local parity

```bash
make compose-up
```

Uses `docker-compose.local.yml` to publish nginx on `http://localhost:9999` and API on `http://localhost:9787`.

Health check through nginx: `http://localhost:9999/api/health`
