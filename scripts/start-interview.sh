#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="v24.22.3"
TOOLS="$ROOT/.tools"
RUNTIME="$TOOLS/node-$VERSION"

fail() { printf 'Setup error: %s\n' "$1" >&2; exit 1; }

case "$(uname -s):$(uname -m)" in
  Darwin:arm64|Darwin:aarch64) PLATFORM=darwin-arm64; ARCHIVE_EXT=tar.gz ;;
  Darwin:x86_64) PLATFORM=darwin-x64; ARCHIVE_EXT=tar.gz ;;
  Linux:x86_64|Linux:amd64) PLATFORM=linux-x64; ARCHIVE_EXT=tar.xz ;;
  Linux:aarch64|Linux:arm64) PLATFORM=linux-arm64; ARCHIVE_EXT=tar.xz ;;
  *) fail "Unsupported platform $(uname -s)/$(uname -m). Install Node.js 24 manually (Node 22.12+ also works)." ;;
esac

for command in curl tar; do command -v "$command" >/dev/null 2>&1 || fail "'$command' is required. Install Git for Windows/macOS/Linux tools or install Node.js 24 manually."; done
if command -v sha256sum >/dev/null 2>&1; then
  sha256_file() { sha256sum "$1" | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
  sha256_file() { shasum -a 256 "$1" | awk '{print $1}'; }
else
  fail "sha256sum or shasum is required to verify the Node download."
fi

mkdir -p "$TOOLS"
if [[ ! -x "$RUNTIME/bin/node" || ! -x "$RUNTIME/bin/npm" ]]; then
  rm -rf "$RUNTIME"
  TMP="$(mktemp -d "$TOOLS/.node-install.XXXXXX")"
  trap 'rm -rf "$TMP"' EXIT
  FILE="node-$VERSION-$PLATFORM.$ARCHIVE_EXT"
  BASE="https://nodejs.org/dist/$VERSION"
  printf 'Downloading verified Node.js %s for %s...\n' "$VERSION" "$PLATFORM"
  curl --fail --location --silent --show-error "$BASE/$FILE" -o "$TMP/$FILE" || fail "Could not download Node.js. Check your internet connection or install Node.js 24 manually."
  curl --fail --location --silent --show-error "$BASE/SHASUMS256.txt" -o "$TMP/SHASUMS256.txt" || fail "Could not download the official Node checksum list."
  EXPECTED="$(awk -v file="$FILE" '$2 == file { print $1 }' "$TMP/SHASUMS256.txt")"
  [[ -n "$EXPECTED" ]] || fail "The official checksum list does not contain $FILE."
  ACTUAL="$(sha256_file "$TMP/$FILE")"
  [[ "$EXPECTED" == "$ACTUAL" ]] || fail "Node archive checksum mismatch; the download was discarded."
  mkdir -p "$TMP/extracted"
  tar -xf "$TMP/$FILE" -C "$TMP/extracted" || fail "Could not unpack Node.js archive."
  mv "$TMP/extracted/node-$VERSION-$PLATFORM" "$RUNTIME"
  chmod -R u+rwX "$RUNTIME"
  rm -rf "$TMP"
  trap - EXIT
fi

NODE="$RUNTIME/bin/node"
NPM_CLI="$RUNTIME/lib/node_modules/npm/bin/npm-cli.js"
export PATH="$RUNTIME/bin:$PATH"
[[ -x "$NODE" && -f "$NPM_CLI" ]] || fail "Cached Node runtime is incomplete. Remove .tools/node-$VERSION and retry."
"$NODE" --version | grep -Fx "$VERSION" >/dev/null || fail "Cached Node runtime version is unexpected. Remove .tools/node-$VERSION and retry."

LOCK_HASH="$(sha256_file "$ROOT/package-lock.json")"
MARKER="$TOOLS/npm-install-lock-sha256"
PREVIOUS=""
[[ -f "$MARKER" ]] && PREVIOUS="$(cat "$MARKER")"
if [[ ! -d "$ROOT/node_modules" || "$LOCK_HASH" != "$PREVIOUS" ]]; then
  printf 'Installing locked project dependencies...\n'
  (cd "$ROOT" && "$NODE" "$NPM_CLI" ci) || fail "Dependency installation failed. Check the network and retry."
  printf '%s\n' "$LOCK_HASH" > "$MARKER"
fi

command -v docker >/dev/null 2>&1 || fail "Docker Desktop is required for the local PostgreSQL database. Install and start Docker Desktop, then retry."
docker compose up -d --wait postgres || fail "Could not start PostgreSQL. Make sure Docker Desktop is running and port 5432 is available."

cd "$ROOT"
printf 'Starting interview app. Open http://127.0.0.1:5173/ . Press Ctrl+C to stop.\n'
exec "$NODE" "$NPM_CLI" run dev
