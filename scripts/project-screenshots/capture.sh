#!/bin/bash
# Captures a screenshot of each project's production site for its card in the
# Projects section (see src/App.tsx). Run by hand whenever a site changes,
# then commit the updated images in public/projects/.
#
#   scripts/project-screenshots/capture.sh
#
# Uses headless Google Chrome for the capture and macOS's sips to shrink it
# to a JPEG, so it needs no extra dependencies on a Mac.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT_DIR="public/projects"

# name=url pairs; each name becomes public/projects/<name>.jpg.
SITES=(
  "vizrisk=https://vizrisk.timarioto.com"
  "timarioto=https://timarioto.com"
  "winchester-storage=https://winchesterrvandboatstorage.com"
)

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$OUT_DIR"
for site in "${SITES[@]}"; do
  name="${site%%=*}"
  url="${site#*=}"
  echo "Capturing $url -> $OUT_DIR/$name.jpg"
  "$CHROME" --headless --hide-scrollbars --window-size=1280,800 \
    --virtual-time-budget=8000 --screenshot="$TMP_DIR/$name.png" "$url" 2>/dev/null
  sips -s format jpeg -s formatOptions 80 --resampleWidth 960 \
    "$TMP_DIR/$name.png" --out "$OUT_DIR/$name.jpg" >/dev/null
done
