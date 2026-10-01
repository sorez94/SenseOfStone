#!/usr/bin/env bash
# Pushes this repo (client + server + compose files) to a fresh Linux server over
# rsync/ssh and brings up the production docker-compose stack there.
#
# One-time setup on the target server: install Docker Engine + the Compose plugin
# (https://docs.docker.com/engine/install/) and make sure the REMOTE_USER can run
# `docker` (e.g. is in the `docker` group).
#
# Usage:
#   cp deploy/.env.deploy.example deploy/.env.deploy   # fill in REMOTE_HOST etc.
#   cp .env.production.example .env                    # fill in real secrets/URLs
#   ./deploy/deploy.sh
#
# Re-running this script redeploys (rsync + `docker compose up -d --build`); it does not
# re-run migrations/seed automatically beyond what the backend container's entrypoint does
# (always applies migrations; only seeds if RUN_SEED=true in .env).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ -f deploy/.env.deploy ]; then
  # shellcheck disable=SC1091
  source deploy/.env.deploy
fi

: "${REMOTE_USER:?Set REMOTE_USER in deploy/.env.deploy (see deploy/.env.deploy.example)}"
: "${REMOTE_HOST:?Set REMOTE_HOST in deploy/.env.deploy}"
: "${REMOTE_DIR:?Set REMOTE_DIR in deploy/.env.deploy}"
SSH_KEY="${SSH_KEY:-}"

if [ ! -f .env ]; then
  echo "Error: .env not found at repo root. Copy .env.production.example to .env and fill it in first." >&2
  exit 1
fi

SSH_OPTS=()
RSYNC_SSH="ssh"
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS+=("-i" "$SSH_KEY")
  RSYNC_SSH="ssh -i $SSH_KEY"
fi

echo "==> Ensuring $REMOTE_DIR exists on $REMOTE_HOST"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"

echo "==> Syncing repo to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
rsync -az --delete \
  -e "$RSYNC_SSH" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'coverage' \
  --exclude 'deploy/.env.deploy' \
  ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

echo "==> Building and starting the stack on $REMOTE_HOST"
ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" \
  "cd '$REMOTE_DIR' && docker compose -f docker-compose.prod.yml up -d --build"

echo "==> Done. Tail logs with:"
echo "    ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml logs -f backend'"
