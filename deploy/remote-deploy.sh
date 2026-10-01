#!/usr/bin/env bash
# Runs ON the production server (not from a dev machine). Invoked over SSH by
# .github/workflows/deploy.yml via a forced-command key for the `deploy` user, so the only
# thing this script trusts as "which commit to deploy" is $SSH_ORIGINAL_COMMAND / $1 - both
# validated below before touching anything.
#
# What it does: pg_dump a safety backup, point IMAGE_TAG at the new commit SHA, pull+recreate
# only backend/frontend (postgres/minio are never touched), health-check, and auto-revert to
# the previous SHA if the health check fails.
#
# Manual use (rollback or re-running a past commit):
#   deploy/remote-deploy.sh <git-sha>

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/sos}"
COMPOSE_FILE="docker-compose.prod.yml"
export COMPOSE_PROJECT_NAME=sos
HEALTH_TIMEOUT_SECONDS=90
BACKUP_DIR="$REPO_DIR/backups"
KEEP_BACKUPS=10

cd "$REPO_DIR"

SHA="${1:-${SSH_ORIGINAL_COMMAND:-}}"
if [[ ! "$SHA" =~ ^[0-9a-f]{7,40}$ ]]; then
  echo "Refusing to deploy: '$SHA' doesn't look like a git commit SHA (7-40 hex chars)." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo ".env not found in $REPO_DIR - copy .env.production.example there and fill it in first." >&2
  exit 1
fi

# shellcheck disable=SC1091
source .env
PREV_IMAGE_TAG="${IMAGE_TAG:-latest}"

if [ -f "$HOME/.ghcr-pat" ]; then
  # GHCR_USER only needs read:packages; stored outside git, deploy user's home only.
  docker login ghcr.io -u "${GHCR_USER:-sorez94}" --password-stdin < "$HOME/.ghcr-pat"
fi

mkdir -p "$BACKUP_DIR"
echo "==> Backing up database before deploying $SHA"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "$BACKUP_DIR/pre-deploy-$(date -u +%Y%m%dT%H%M%SZ)-${PREV_IMAGE_TAG}.sql"
ls -1t "$BACKUP_DIR"/pre-deploy-*.sql 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm --

set_image_tag() {
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$1/" .env
}

deploy_tag() {
  local tag="$1"
  set_image_tag "$tag"
  # shellcheck disable=SC1091
  source .env
  docker compose -f "$COMPOSE_FILE" pull backend frontend
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans backend frontend
}

wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  while [ $SECONDS -lt $deadline ]; do
    if curl -fsS -o /dev/null http://127.0.0.1:4000/v1/health \
      && curl -fsS -o /dev/null http://127.0.0.1:3000/; then
      return 0
    fi
    sleep 3
  done
  return 1
}

echo "==> Deploying $SHA (previous: $PREV_IMAGE_TAG)"
deploy_tag "$SHA"

if wait_healthy; then
  echo "$SHA" > "$REPO_DIR/CURRENT_SHA"
  docker image prune -f >/dev/null 2>&1 || true
  echo "==> Deploy succeeded: $SHA is live and healthy."
  exit 0
fi

echo "==> Health check failed for $SHA - rolling back to $PREV_IMAGE_TAG" >&2
deploy_tag "$PREV_IMAGE_TAG"
if wait_healthy; then
  echo "==> Rolled back to $PREV_IMAGE_TAG successfully. Deploy of $SHA FAILED." >&2
else
  echo "==> Rollback to $PREV_IMAGE_TAG ALSO failed health check - manual intervention needed." >&2
fi
exit 1
