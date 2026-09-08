# Deploy

Spendly runs self-hosted on a single laptop.

| Piece | Where | How it ships |
| --- | --- | --- |
| Frontend | GitHub Pages (`https://<user>.github.io`) | GitHub Actions, automatic |
| Backend | Docker on WSL Ubuntu, exposed via Cloudflare Tunnel | `scripts/deploy-backend.sh`, manual |
| Database | SQLite in the `spendly_spendly-data` Docker volume (`/data/spendly.db`) | migrations run on container startup |

There is no cloud host. If the laptop is off, the API is down (the frontend still loads but can't sign in or fetch data).

## Frontend

Automatic. `.github/workflows/deploy-frontend.yml` builds and publishes on every push to `main` that touches `frontend/**`. It builds with `VITE_USE_MOCK_API=false` and injects, from GitHub repo **Variables** (Settings > Secrets and variables > Actions > Variables):

- `VITE_API_URL` — the Cloudflare Tunnel hostname for the backend
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

Nothing to run locally. Trigger a rebuild without a code change from the Actions tab ("Run workflow").

## Backend

### First-time setup

1. `cp .env.example .env` and fill every value. `FRONTEND_ORIGINS` must be the exact deployed frontend origin (e.g. `https://<user>.github.io`, no trailing slash). `SESSION_SECRET`: `openssl rand -hex 32`.
2. Create the Cloudflare Tunnel (Zero Trust > Networks > Tunnels), add a public hostname routing to `http://backend:8000`, copy the Docker token into `CLOUDFLARE_TUNNEL_TOKEN`.
3. In Docker Desktop / WSL, make sure the daemon is up: `sudo service docker start`.

### Routine deploy

From WSL, in the repo root:

```bash
git pull
bash scripts/deploy-backend.sh
```

The script backs up the DB volume to `backups/`, rebuilds, restarts, and waits for `/health`. Migrations (`alembic upgrade head`) run automatically when the container starts — watch the log lines it prints.

### Rollback

```bash
docker compose -f docker-compose.prod.yml down
# restore a backup into the volume
docker run --rm -v spendly_spendly-data:/data -v "$PWD/backups":/backup alpine \
  cp /backup/spendly-<STAMP>.db /data/spendly.db
git checkout <previous-good-sha>
bash scripts/deploy-backend.sh
```

A schema-only rollback (keep the data, undo the last migration): `docker compose -f docker-compose.prod.yml exec backend alembic downgrade -1`.

## Troubleshooting

- **`variable is not set` on compose up** — `.env` is missing or incomplete.
- **Frontend loads, login fails with CORS** — `FRONTEND_ORIGINS` doesn't match the browser origin exactly.
- **`docker: command not found`** — you're in PowerShell; Docker lives in WSL. Run the script from `wsl`.
- **Tunnel container restarts** — bad or expired `CLOUDFLARE_TUNNEL_TOKEN`.
- **Everything was fine, now the API is unreachable** — the laptop slept or WSL stopped. `wsl` then `sudo service docker start` then re-run the deploy script (`up -d` is idempotent).
