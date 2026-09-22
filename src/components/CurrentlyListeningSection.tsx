import { useEffect, useState } from 'react'
import { ArrowUpRightIcon } from '../icons'
import './CurrentlyListeningSection.css'

interface SongOfTheMonth {
  updatedAt: string
  month: string
  title: string
  artist: string | null
  artworkUrl: string | null
  url: string
  playCount: number | null
}

interface AlbumOfTheMonth {
  updatedAt: string
  month: string
  title: string
  artist: string | null
  artworkUrl: string | null
  url: string
  playCount: number | null
}

function playsDescription(artist: string | null, playCount: number | null) {
  const plays = playCount ? `${playCount} play${playCount === 1 ? '' : 's'}` : null
  return [artist, plays].filter(Boolean).join(' · ') || null
}

export default function CurrentlyListeningSection() {
  const [song, setSong] = useState<SongOfTheMonth | null>(null)
  const [album, setAlbum] = useState<AlbumOfTheMonth | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/song.json')
      .then((res) => res.json())
      .then((data: SongOfTheMonth) => {
        if (!cancelled) setSong(data)
      })
      .catch(() => {
        // No data yet (e.g. the poller hasn't run, or CloudFront served the
        // SPA fallback instead of a real song.json) — render nothing.
      })

    fetch('/album.json')
      .then((res) => res.json())
      .then((data: AlbumOfTheMonth) => {
        if (!cancelled) setAlbum(data)
      })
      .catch(() => {
        // No data yet (e.g. the poller hasn't run, or CloudFront served the
        // SPA fallback instead of a real album.json) — render nothing.
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!song && !album) return null

  return (
    <section className="currently-listening-section" aria-label="Currently Listening">
      <h2 className="currently-listening-title">Currently Listening</h2>
      <div className="currently-listening-grid">
        {song && (
          <a className="currently-listening-card" href={song.url} target="_blank" rel="noopener noreferrer">
            {song.artworkUrl && (
              <img className="currently-listening-artwork" src={song.artworkUrl} alt="" width={600} height={600} />
            )}
            <div className="currently-listening-card-body">
              <span className="currently-listening-kicker">Song of the month</span>
              <span className="currently-listening-card-title">
                {song.title}
                <ArrowUpRightIcon className="currently-listening-arrow" />
              </span>
              {playsDescription(song.artist, song.playCount) && (
                <p className="currently-listening-description">{playsDescription(song.artist, song.playCount)}</p>
              )}
            </div>
          </a>
        )}
        {album && (
          <a className="currently-listening-card" href={album.url} target="_blank" rel="noopener noreferrer">
            {album.artworkUrl && (
              <img className="currently-listening-artwork" src={album.artworkUrl} alt="" width={600} height={600} />
            )}
            <div className="currently-listening-card-body">
              <span className="currently-listening-kicker">Album of the month</span>
              <span className="currently-listening-card-title">
                {album.title}
                <ArrowUpRightIcon className="currently-listening-arrow" />
              </span>
              {playsDescription(album.artist, album.playCount) && (
                <p className="currently-listening-description">{playsDescription(album.artist, album.playCount)}</p>
              )}
            </div>
          </a>
        )}
      </div>
    </section>
  )
}
