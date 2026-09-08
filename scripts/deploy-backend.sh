#!/usr/bin/env bash
# Deploy the Spendly backend (FastAPI + Cloudflare Tunnel) on this machine.
# Run from WSL: bash scripts/deploy-backend.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE="docker-compose.prod.yml"
PROJECT="spendly"
VOLUME="${PROJECT}_spendly-data"
BACKUP_DIR="$ROOT_DIR/backups"

command -v docker >/dev/null || { echo "docker not found — run this inside WSL"; exit 1; }
docker info >/dev/null 2>&1 || { echo "docker daemon not running — start Docker / 'sudo service docker start'"; exit 1; }
[ -f .env ] || { echo "missing .env — copy .env.example to .env and fill it in"; exit 1; }

echo "==> Backing up the database"
mkdir -p "$BACKUP_DIR"
if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  docker run --rm -v "$VOLUME":/data -v "$BACKUP_DIR":/backup alpine \
    sh -c 'test -f /data/spendly.db && cp /data/spendly.db "/backup/spendly-'"$STAMP"'.db" || echo "  (no spendly.db yet)"'
  ls -1 "$BACKUP_DIR"/spendly-*.db 2>/dev/null | tail -1 | sed 's/^/  saved /' || true
  ls -1t "$BACKUP_DIR"/spendly-*.db 2>/dev/null | tail -n +11 | xargs -r rm --  # keep 10
else
  echo "  first deploy — no volume yet"
fi

echo "==> Building and starting"
docker compose -f "$COMPOSE" pull cloudflared
docker compose -f "$COMPOSE" up -d --build

echo "==> Waiting for the backend to pass its health check"
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE" exec -T backend \
      python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status==200 else 1)" 2>/dev/null; then
    echo "  healthy"
    break
  fi
  [ "$i" = 30 ] && { echo "  never became healthy — logs:"; docker compose -f "$COMPOSE" logs --tail 50 backend; exit 1; }
  sleep 2
done

echo "==> Migration / startup log"
docker compose -f "$COMPOSE" logs --tail 30 backend | grep -Ei "alembic|running upgrade|startup complete" || true

echo "==> Status"
docker compose -f "$COMPOSE" ps
echo "Done. Rollback: docker compose -f $COMPOSE down && restore a file from $BACKUP_DIR into the $VOLUME volume."
