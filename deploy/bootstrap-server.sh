#!/usr/bin/env bash
# One-time setup for a CLEAN Ubuntu/Debian server, run once as root (or via sudo) BEFORE the
# first CI deploy. Not run by CI, not idempotent-tested beyond "safe to re-run" - read it
# before running it, this is production.
#
# What it does:
#   - installs Docker Engine + the compose plugin from Docker's official apt repo
#   - creates an unprivileged `deploy` system user (no sudo) that owns /opt/sos
#   - installs the CI public key into deploy's authorized_keys, restricted to a forced
#     command (deploy/ssh-command-wrapper.sh) - that key can NEVER get an interactive shell
#   - seeds /opt/sos with docker-compose.prod.yml, deploy/, and .env (from
#     .env.production.example, which you still have to fill in by hand)
#
# Usage (run from a checkout of this repo on the server, or after scp'ing the repo there):
#   sudo deploy/bootstrap-server.sh /path/to/ci_deploy_key.pub
#
# After it finishes, see the printed NEXT STEPS - you still need to: fill in /opt/sos/.env,
# add the matching private key + host/user as GitHub Actions secrets, and bring the stack up
# for the first time by hand.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root (sudo deploy/bootstrap-server.sh ...)." >&2
  exit 1
fi

CI_PUBKEY_FILE="${1:-}"
if [[ -z "$CI_PUBKEY_FILE" || ! -f "$CI_PUBKEY_FILE" ]]; then
  echo "Usage: $0 /path/to/ci_deploy_key.pub" >&2
  echo "Generate that keypair first, e.g.: ssh-keygen -t ed25519 -f ci_deploy_key -N ''" >&2
  echo "Then pass ci_deploy_key.pub here, and keep ci_deploy_key (private) for the" >&2
  echo "GitHub Actions SSH_PRIVATE_KEY secret." >&2
  exit 1
fi

REPO_DIR="/opt/sos"
DEPLOY_USER="deploy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Installing Docker Engine + compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
  echo "    docker already installed, skipping."
fi

echo "==> Creating unprivileged '$DEPLOY_USER' user"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  # Real shell (not nologin) is required - sshd runs the forced command via this user's
  # shell. No sudo group membership; docker group is the only elevated access it gets,
  # which is also what lets it run `docker compose` without sudo.
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
else
  echo "    user already exists, skipping creation."
  usermod -aG docker "$DEPLOY_USER"
fi

echo "==> Locking down SSH access for '$DEPLOY_USER'"
DEPLOY_HOME="/home/$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
PUBKEY_CONTENTS="$(cat "$CI_PUBKEY_FILE")"
FORCED_COMMAND="command=\"$REPO_DIR/deploy/ssh-command-wrapper.sh\",no-agent-forwarding,no-X11-forwarding,no-port-forwarding,no-pty"
AUTH_KEYS="$DEPLOY_HOME/.ssh/authorized_keys"
if [[ -f "$AUTH_KEYS" ]] && grep -qF "$PUBKEY_CONTENTS" "$AUTH_KEYS"; then
  echo "    key already authorized, skipping."
else
  echo "$FORCED_COMMAND $PUBKEY_CONTENTS" >> "$AUTH_KEYS"
fi
chmod 600 "$AUTH_KEYS"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH_KEYS"

echo "==> Seeding $REPO_DIR"
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$REPO_DIR" "$REPO_DIR/backups"
cp "$SCRIPT_DIR"/../docker-compose.prod.yml "$REPO_DIR/docker-compose.prod.yml"
cp -r "$SCRIPT_DIR" "$REPO_DIR/deploy"
chmod +x "$REPO_DIR"/deploy/*.sh
if [[ ! -f "$REPO_DIR/.env" ]]; then
  cp "$SCRIPT_DIR/../.env.production.example" "$REPO_DIR/.env"
  echo "    wrote $REPO_DIR/.env from .env.production.example - YOU MUST EDIT IT before" \
    "first bring-up (passwords, JWT secrets, server IP/domain)."
fi
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$REPO_DIR"
chmod 600 "$REPO_DIR/.env"

cat <<EOF

==> Bootstrap done. NEXT STEPS:

1. Edit $REPO_DIR/.env - fill in real POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD, JWT secrets,
   CORS_ORIGINS, NEXT_PUBLIC_* etc (see the comments in that file). Leave IMAGE_TAG=latest
   for now and RUN_SEED=false unless this is a brand-new database.

2. If the GHCR packages (ghcr.io/sorez94/senseofstone-{server,client}) are private, put a
   read-only GHCR PAT at $DEPLOY_HOME/.ghcr-pat (chmod 600, owned by $DEPLOY_USER):
     echo '<token>' > $DEPLOY_HOME/.ghcr-pat && chmod 600 $DEPLOY_HOME/.ghcr-pat

3. In the GitHub repo's Settings -> Secrets and variables -> Actions, set:
     SSH_PRIVATE_KEY = the private half of $CI_PUBKEY_FILE
     SSH_HOST        = this server's address
     SSH_USER        = $DEPLOY_USER
   and under Variables, the NEXT_PUBLIC_* values the client build needs.

4. First bring-up (manual, one time - after that, CI drives everything):
     su - $DEPLOY_USER
     cd $REPO_DIR
     export COMPOSE_PROJECT_NAME=sos
     # First run only: set RUN_SEED=true in .env if this is a fresh DB, then after this
     # succeeds set it back to false so redeploys don't reseed live data.
     docker compose -f docker-compose.prod.yml pull backend frontend || true   # may be
       # empty/fail if no image has been pushed yet - that's fine, compose will still start
       # postgres/minio; push to master once to get the first backend/frontend images built.
     docker compose -f docker-compose.prod.yml up -d

5. Push to master and confirm the Actions run succeeds end-to-end, then
   curl http://<server>:4000/v1/health and check the returned commit matches github.sha.
EOF
