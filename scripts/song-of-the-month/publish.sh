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
  # No baseline from the start of the month (e.g. snapshots only began
  # partway through it). Use the oldest snapshot we have so only plays gained
  # since then count — never fall back to lifetime play counts.
  START_SNAPSHOT_DATE="$(earliest_snapshot)"
  log "No snapshot from on or before $LAST_MONTH_START —" \
      "using earliest snapshot $START_SNAPSHOT_DATE as the baseline (partial month)."
fi

if [[ "$START_SNAPSHOT_DATE" == "$END_SNAPSHOT_DATE" ]]; then
  log "Only one usable snapshot ($END_SNAPSHOT_DATE) — can't diff yet. Nothing to publish."
  exit 0
fi

START_FILE="$SNAPSHOT_DIR/$START_SNAPSHOT_DATE.json"
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
# {title, artist, artworkUrl, url} as JSON. Only accepts a result whose title
# and artist actually match — the API's fuzzy search happily returns unrelated
# tracks when it doesn't index something (common for new releases). With no
# real match, falls back to an Apple Music search link with no artwork.
itunes_lookup() {
  local name="$1" artist="$2" entity="$3" name_field="$4" collection_field="$5"
  local query
  query="$(urlencode "$name $artist")"
  {
    curl -sf --max-time 10 "https://itunes.apple.com/search?term=$query&entity=$entity&limit=25" || echo '{"results":[]}'
  } | jq -c \
      --arg name "$name" --arg artist "$artist" --arg query "$query" \
      --arg name_field "$name_field" --arg collection_field "$collection_field" '
        def norm: ascii_downcase | sub(" - (single|ep)$"; "");
        ([.results[]
          | select((.[$name_field] // "" | norm) == ($name | norm))
          | select((.artistName // "" | ascii_downcase) | contains($artist | ascii_downcase))
        ][0]) as $hit
        | if $hit then {
            title: $hit[$name_field],
            artist: $hit.artistName,
            artworkUrl: ($hit.artworkUrl100 | sub("100x100bb\\.jpg$"; "1200x1200bb.jpg")),
            url: $hit[$collection_field]
          } else {
            title: $name,
            artist: $artist,
            artworkUrl: null,
            url: "https://music.apple.com/us/search?term=\($query)"
          } end
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
  MATCH="$(itunes_lookup "$NAME" "$ARTIST" "song" "trackName" "trackViewUrl" || true)"

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
  MATCH="$(itunes_lookup "$ALBUM" "$ARTIST" "album" "collectionName" "collectionViewUrl" || true)"

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
