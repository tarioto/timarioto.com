# Takes two slurped snapshot arrays — [start, end] — and finds the track
# and album with the most plays gained between them (end.count - start.count,
# per track id; unseen tracks in `start` count as zero plays before).
(.[0] | map({ (.id): .count }) | add // {}) as $start
| .[1]
| map(. + { delta: ((.count // 0) - ($start[.id] // 0)) })
| map(select(.delta > 0)) as $plays
| ($plays | sort_by(-.delta) | .[0]) as $top_song
| ($plays
    | group_by(.album)
    | map({ album: .[0].album, artist: .[0].artist, delta: (map(.delta) | add) })
    | sort_by(-.delta)
    | .[0]
  ) as $top_album
| { song: $top_song, album: $top_album }
