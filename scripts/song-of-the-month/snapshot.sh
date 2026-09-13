#!/bin/bash
# Dumps today's Apple Music play counts to a dated JSON snapshot. Run daily
# (see launchd/com.timarioto.song-of-the-month.snapshot.plist) — publish.sh
# diffs two of these snapshots to find what gained the most plays in a
# given month, since Music.app itself only exposes a lifetime play count
# per track, not a timestamped play log.
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./lib.sh

TODAY="$(date +%Y-%m-%d)"
OUT_FILE="$SNAPSHOT_DIR/$TODAY.json"

log "Snapshotting Apple Music play counts to $OUT_FILE"

osascript -l JavaScript -e '
  const Music = Application("Music")
  const played = Music.tracks.whose({ playedCount: { ">": 0 } })
  const ids = played.persistentID()
  const names = played.name()
  const artists = played.artist()
  const albums = played.album()
  const counts = played.playedCount()
  const out = []
  for (let i = 0; i < ids.length; i++) {
    out.push({ id: ids[i], name: names[i], artist: artists[i], album: albums[i], count: counts[i] })
  }
  JSON.stringify(out)
' > "$OUT_FILE"

TRACK_COUNT="$(jq 'length' "$OUT_FILE")"
log "Wrote $TRACK_COUNT played tracks."

# Snapshots are only ever diffed against roughly a month back — keep a
# generous buffer but don't let them accumulate forever.
RETENTION_DAYS=95
CUTOFF="$(date -v-${RETENTION_DAYS}d +%Y-%m-%d)"
find "$SNAPSHOT_DIR" -maxdepth 1 -name '20*.json' -exec basename {} .json \; | while read -r date; do
  if [[ "$date" < "$CUTOFF" ]]; then
    rm -f "$SNAPSHOT_DIR/$date.json"
    log "Pruned old snapshot $date.json"
  fi
done
