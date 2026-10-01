#!/usr/bin/env bash
# Manual rollback: redeploys a specific past commit SHA (must have a matching image already
# pushed to GHCR by a previous CI run). Run this ON the production server.
#
# Usage:
#   deploy/rollback.sh <git-sha>
#
# To find past SHAs, check $REPO_DIR/CURRENT_SHA history or your GHCR package's tag list.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
exec deploy/remote-deploy.sh "$@"
