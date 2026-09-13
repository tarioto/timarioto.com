#!/bin/bash
# Computes last month's most-played song and album from Music.app play-count
# snapshots, resolves each to its public Apple Music catalog entry via the
# (free, unauthenticated) iTunes Search API, and uploads song.json/album.json
# straight to the site bucket. Run on the 1st of each month (see
# launchd/com.timarioto.song-of-the-month.publish.plist).
cd "$(dirname "${BASH_SOURCE[0]}")"
source ./lib.sh

THIS_MONTH_START="$(date -v1d +%Y-%m-%d)"
LAST_MONTH_START="$(date -v1d -v-1m +%Y-%m-%d)"
LAST_MONTH_LABEL="$(date -v1d -v-1m +%Y-%m)"

START_SNAPSHOT_DATE="$(nearest_snapshot_on_or_before "$LAST_MONTH_START")"
END_SNAPSHOT_DATE="$(nearest_snapshot_on_or_before "$THIS_MONTH_START")"

if [[ -z "$END_SNAPSHOT_DATE" ]]; then
  log "No snapshots at all yet — nothing to publish. Is snapshot.sh running?"
  exit 0
fi

if [[ -z "$START_SNAPSHOT_DATE" ]]; then
  log "No snapshot from before $LAST_MONTH_START yet — this must be the first run." \
      "Treating all current lifetime plays as '$LAST_MONTH_LABEL' plays (one-time overcount)."
  START_FILE="$(mktemp)"
  echo '[]' > "$START_FILE"
else
  START_FILE="$SNAPSHOT_DIR/$START_SNAPSHOT_DATE.json"
fi

END_FILE="$SNAPSHOT_DIR/$END_SNAPSHOT_DATE.json"
log "Comparing $START_FILE -> $END_FILE for $LAST_MONTH_LABEL"

TOP="$(jq -s -f top-plays.jq "$START_FILE" "$END_FILE")"

TOP_SONG="$(echo "$TOP" | jq -c '.song // empty')"
TOP_ALBUM="$(echo "$TOP" | jq -c '.album // empty')"

if [[ -z "$TOP_SONG" && -z "$TOP_ALBUM" ]]; then
  log "No plays recorded for $LAST_MONTH_LABEL — leaving existing song.json/album.json in place."
  exit 0
fi

# Looks up a title/artist against the iTunes Search API and prints
# {title, artist, artworkUrl, url} as JSON, or nothing if no match.
itunes_lookup() {
  local term="$1" entity="$2" name_field="$3" collection_field="$4"
  local query
  query="$(urlencode "$term")"
  curl -sf --max-time 10 "https://itunes.apple.com/search?term=$query&entity=$entity&limit=1" \
    | jq -c --arg name_field "$name_field" --arg collection_field "$collection_field" '
        .results[0]
        | select(. != null)
        | {
            title: .[$name_field],
            artist: .artistName,
            artworkUrl: (.artworkUrl100 | sub("100x100bb\\.jpg$"; "1200x1200bb.jpg")),
            url: .[$collection_field]
          }
      '
}

publish_json() {
  local key="$1" payload="$2"
  local tmp
  tmp="$(mktemp)"
  echo "$payload" > "$tmp"
  aws s3 cp "$tmp" "s3://$SITE_BUCKET/$key" \
    --profile "$AWS_PROFILE_NAME" \
    --content-type application/json \
    --cache-control "public, max-age=3600"
  rm -f "$tmp"
}

if [[ -n "$TOP_SONG" ]]; then
  NAME="$(echo "$TOP_SONG" | jq -r '.name')"
  ARTIST="$(echo "$TOP_SONG" | jq -r '.artist')"
  DELTA="$(echo "$TOP_SONG" | jq -r '.delta')"
  MATCH="$(itunes_lookup "$NAME $ARTIST" "song" "trackName" "trackViewUrl" || true)"

  if [[ -z "$MATCH" ]]; then
    log "WARNING: no iTunes catalog match for song '$NAME' by '$ARTIST' — skipping song.json."
  else
    PAYLOAD="$(jq -n \
      --arg updatedAt "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
      --arg month "$LAST_MONTH_LABEL" \
      --argjson match "$MATCH" \
      --argjson playCount "$DELTA" \
      '{updatedAt: $updatedAt, month: $month} + $match + {playCount: $playCount}')"
    log "Song of the month for $LAST_MONTH_LABEL: $NAME by $ARTIST ($DELTA plays)"
    publish_json "song.json" "$PAYLOAD"
  fi
fi

if [[ -n "$TOP_ALBUM" ]]; then
  ALBUM="$(echo "$TOP_ALBUM" | jq -r '.album')"
  ARTIST="$(echo "$TOP_ALBUM" | jq -r '.artist')"
  DELTA="$(echo "$TOP_ALBUM" | jq -r '.delta')"
  MATCH="$(itunes_lookup "$ALBUM $ARTIST" "album" "collectionName" "collectionViewUrl" || true)"

  if [[ -z "$MATCH" ]]; then
    log "WARNING: no iTunes catalog match for album '$ALBUM' by '$ARTIST' — skipping album.json."
  else
    PAYLOAD="$(jq -n \
      --arg updatedAt "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
      --arg month "$LAST_MONTH_LABEL" \
      --argjson match "$MATCH" \
      --argjson playCount "$DELTA" \
      '{updatedAt: $updatedAt, month: $month} + $match + {playCount: $playCount}')"
    log "Album of the month for $LAST_MONTH_LABEL: $ALBUM by $ARTIST ($DELTA plays)"
    publish_json "album.json" "$PAYLOAD"
  fi
fi
