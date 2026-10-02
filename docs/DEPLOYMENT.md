# Deployment

How a push to `master` ends up running on the production server, how to set that server up
from scratch, and how to roll back when something goes wrong. This ties together
`.github/workflows/deploy.yml`, `docker-compose.prod.yml`, and everything in `deploy/`.

## 1. Architecture

Single Linux server running Docker Compose: Postgres + MinIO (stateful, persistent volumes)
behind the backend (NestJS) and frontend (Next.js), both running **prebuilt, commit-SHA-tagged
images** pulled from GHCR — nothing is built on the server.

```
Developer                 GitHub Actions                      Production server
    │                    (.github/workflows/deploy.yml)        (/opt/sos, user: deploy)
    │  git push master         │                                       │
    ├─────────────────────────►│                                       │
    │                    build-and-push:                               │
    │                      docker build server, client                 │
    │                      push :<sha> and :latest to GHCR              │
    │                          │                                       │
    │                    deploy:                                       │
    │                      scp -O docker-compose.prod.yml + deploy/ ───►│  ssh-command-wrapper.sh
    │                      ssh ... "<sha>"  ─────────────────────────►│  (forced command)
    │                          │                               remote-deploy.sh <sha>:
    │                          │                                 1. pg_dump backup
    │                          │                                 2. IMAGE_TAG=<sha> in .env
    │                          │                                 3. docker compose pull + up -d
    │                          │                                    (backend + frontend only;
    │                          │                                     postgres/minio untouched)
    │                          │                                 4. poll /v1/health for 90s
    │                          │                                 5. OK  -> write CURRENT_SHA
    │                          │                                    FAIL -> revert IMAGE_TAG to
    │                          │                                            previous value, redeploy
    ▼                          ▼                                       ▼
 commit <sha>              images in GHCR                    production running <sha>
```

Key properties:
- **Traceable**: `GET /v1/health` returns `{status, commit}` where `commit` is the `GIT_SHA`
  baked into the backend image at build time — you can always confirm exactly which commit is
  live.
- **No downtime-prone rebuilds on prod**: the server only ever pulls an already-built image.
- **DB/object storage are never recreated by a deploy** — only `backend`/`frontend` are
  touched; `postgres`/`minio` keep running with their existing volumes.
- **Auto-rollback on failed health check**, plus a manual rollback to any past SHA (as long as
  that SHA's image still exists in GHCR, which has no expiry by default).

See also the comments at the top of `docker-compose.prod.yml` and `deploy/remote-deploy.sh` —
this doc summarizes them, those files are the source of truth if anything drifts.

## 2. One-time server setup (clean box)

Run as root, from a checkout of this repo (or after `scp`-ing the repo there — it's only
needed temporarily to run the bootstrap script):

```bash
ssh-keygen -t ed25519 -f ci_deploy_key -N ''      # on your own machine, not the server
scp ci_deploy_key.pub root@<server>:/root/
ssh root@<server>
sudo /path/to/repo/deploy/bootstrap-server.sh /root/ci_deploy_key.pub
```

This installs Docker + the compose plugin, creates an unprivileged `deploy` system user (no
sudo, member of the `docker` group only), authorizes the CI public key with a **forced
command** restricted to `deploy/ssh-command-wrapper.sh` (that key can never get an
interactive shell — see that file's header comment for exactly what it's allowed to do), and
seeds `/opt/sos` with `docker-compose.prod.yml`, `deploy/`, and `.env` (copied from
`.env.production.example`).

The script prints a NEXT STEPS block at the end — follow it. In short, after it runs you still
need to, by hand:

1. **Edit `/opt/sos/.env`** on the server — real `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`,
   `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (`openssl rand -hex 64` each), `CORS_ORIGINS`,
   `NEXT_PUBLIC_*`, etc. Leave `IMAGE_TAG=latest` and `RUN_SEED=false` unless this is a brand
   new database (see `.env.production.example` for every field).
2. **If the GHCR packages are private**, put a read-only GHCR PAT at
   `/home/deploy/.ghcr-pat` (`chmod 600`, owned by `deploy`) — `remote-deploy.sh` logs in with
   it automatically if present.
3. **Configure GitHub** (next section).
4. **First manual bring-up** (after step 3, once CI has pushed at least one image):
   ```bash
   su - deploy
   cd /opt/sos
   export COMPOSE_PROJECT_NAME=sos
   docker compose -f docker-compose.prod.yml up -d
   ```
   After that, CI drives every subsequent deploy — you shouldn't need to SSH in again except
   to check logs or do a manual rollback.

## 3. GitHub configuration

**Settings → Secrets and variables → Actions → Secrets:**

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | the private half of the keypair you generated above (`ci_deploy_key`, not the `.pub`) |
| `SSH_HOST` | the server's address |
| `SSH_USER` | `deploy` |

`GITHUB_TOKEN` (for pushing to GHCR) is provided automatically — nothing to configure.

**Settings → Secrets and variables → Actions → Variables** (these get baked into the client
bundle at build time, so they're not secrets — don't put real secrets here):

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_MODE` | `http` |
| `NEXT_PUBLIC_API_BASE_URL` | `http://<server-ip>:4000/v1` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (if using Google login) |
| `NEXT_PUBLIC_IMAGE_HOSTS` | `<server-ip>` |
| `NEXT_PUBLIC_SITE_URL` | `http://<server-ip>` |

These must match whatever you put in `/opt/sos/.env` on the server.

## 4. Normal deploy flow

Just `git push origin master`. The workflow:

1. Builds and pushes `server`/`client` images to GHCR, tagged `:<commit-sha>` and `:latest`.
2. `scp -O`s `docker-compose.prod.yml` and `deploy/` to `/opt/sos` (keeps the server's copies
   in sync with master — this is why the deploy key is also allowed to run legacy-protocol
   `scp`, see `deploy/ssh-command-wrapper.sh`).
3. SSHes in with the commit SHA as the command; the forced command routes it to
   `remote-deploy.sh <sha>`, which backs up the DB, repoints `IMAGE_TAG`, pulls + recreates
   `backend`/`frontend`, and health-checks.

Two pushes close together queue rather than race (`concurrency: production-deploy` in the
workflow).

**Verify a deploy:**
```bash
curl http://<server>:4000/v1/health
# {"status":"ok","commit":"<the sha you just pushed>"}
```
or check `/opt/sos/CURRENT_SHA` on the server, or the Actions run's logs.

## 5. Rollback

**Automatic**: if the post-deploy health check fails within 90s, `remote-deploy.sh` reverts
`IMAGE_TAG` to the previous value and redeploys that — no action needed, but check the Actions
log / server logs to see why the new version failed.

**Manual**, to any past commit (its image must still be in GHCR):
```bash
ssh deploy@<server>     # or: su - deploy, if already on the box
cd /opt/sos
deploy/rollback.sh <git-sha>
```
Past SHAs: check `/opt/sos/CURRENT_SHA`'s history, the GHCR package's tag list, or
`git log master`.

**Database**: a `pg_dump` is taken to `/opt/sos/backups/` before every deploy (last 10 kept).
Rollback only swaps the application images back — it does **not** undo a schema migration a
bad release may have already applied. If a deploy included a breaking migration, restoring
from that backup is a manual step; auto-rollback alone is not sufficient in that case.

## 6. Known limitations

- **No TLS / reverse proxy** — the stack serves plain HTTP. Put Nginx/Caddy or Cloudflare in
  front of it before handling real user credentials in production, if you haven't already.
- **Brief downtime on each deploy** — `backend`/`frontend` are recreated in place with no
  second replica or load balancer, so there's a short gap (container restart time) with no
  server to answer requests. Acceptable at this scale; true zero-downtime would need multiple
  replicas or blue/green, which this single-server setup doesn't do.
- **Schema migrations aren't automatically reversible** — see the rollback section above.
- **`deploy` user can write anywhere it owns** via the scp half of the forced command
  (`scp -t` lets the client pick the destination path) — mitigated by that user having no
  sudo and owning only its home directory and `/opt/sos`.
