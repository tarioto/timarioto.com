#!/bin/bash
# Shared config/helpers for snapshot.sh and publish.sh. Source, don't run.
set -euo pipefail

SITE_BUCKET="${SITE_BUCKET:-timarioto-com-site}"
AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-song-of-the-month}"

STATE_DIR="${SONG_STATE_DIR:-$HOME/Library/Application Support/song-of-the-month}"
SNAPSHOT_DIR="$STATE_DIR/snapshots"
mkdir -p "$SNAPSHOT_DIR"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

# Prints the date (YYYY-MM-DD) of the most recent snapshot file on or before
# the given date. Empty output means no snapshot that old exists yet.
nearest_snapshot_on_or_before() {
  local target="$1"
  find "$SNAPSHOT_DIR" -maxdepth 1 -name '20*.json' -exec basename {} .json \; \
    | sort \
    | awk -v t="$target" '$0 <= t' \
    | tail -1
}

# Percent-encodes a string for use in a URL query parameter.
urlencode() {
  jq -rn --arg s "$1" '$s | @uri'
}
