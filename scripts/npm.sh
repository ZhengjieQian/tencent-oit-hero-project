#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME="$ROOT/.tools/node-v24.22.3"
NODE="$RUNTIME/bin/node"
NPM_CLI="$RUNTIME/lib/node_modules/npm/bin/npm-cli.js"

if [[ ! -x "$NODE" || ! -f "$NPM_CLI" ]]; then
  printf 'Project-local Node.js is not ready. Run ./scripts/start-interview.sh once first.\n' >&2
  exit 1
fi

export PATH="$RUNTIME/bin:$PATH"
cd "$ROOT"
exec "$NODE" "$NPM_CLI" "$@"
