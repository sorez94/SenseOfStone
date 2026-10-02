#!/usr/bin/env bash
# Forced command for the CI deploy SSH key. authorized_keys pins this key to
# command="/opt/sos/deploy/ssh-command-wrapper.sh" (see bootstrap-server.sh) so the key can
# never run anything else, including an interactive shell.
#
# It has to serve two purposes with one restricted key:
#   1. let .github/workflows/deploy.yml scp docker-compose.prod.yml + deploy/ into /opt/sos
#      before every deploy, so the server's copy never drifts from master
#   2. run remote-deploy.sh with the commit SHA to actually trigger the deploy
#
# scp only appears here as a "scp -t ..." / "scp -f ..." exec command if the client forces
# the legacy SCP protocol (`scp -O ...`); modern scp defaults to the SFTP subsystem instead,
# which a forced `command=` can't selectively allow through. The workflow passes -O for
# exactly this reason - don't drop it there without updating this wrapper too.
#
# Only scp's own client ever sends "scp -t"/"-f" as a command, so matching that prefix can't
# be used to smuggle an arbitrary command. Anything else is treated as a commit SHA and
# handed to remote-deploy.sh, which validates it against ^[0-9a-f]{7,40}$ before doing
# anything. Because scp -t can write to any path the `deploy` OS user can write to, that
# user must stay unprivileged (no sudo, owns only its home + /opt/sos) - see
# bootstrap-server.sh.
set -euo pipefail

case "${SSH_ORIGINAL_COMMAND:-}" in
  "scp -t "*|"scp -f "*)
    exec $SSH_ORIGINAL_COMMAND
    ;;
  *)
    exec /opt/sos/deploy/remote-deploy.sh "${SSH_ORIGINAL_COMMAND:-}"
    ;;
esac
