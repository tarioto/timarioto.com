import { useEffect, useState } from 'react'
import { ArrowUpRightIcon } from '../icons'
import './CurrentlyListeningSection.css'
import GlassCard from './GlassCard'

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

// Square artwork with a headphones placeholder for when there's no artwork
// URL (the iTunes lookup found no catalog match) or the image fails to load.
function Artwork({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="currently-listening-artwork currently-listening-artwork-fallback" aria-hidden="true">
        🎧
      </div>
    )
  }

  return (
    <img
      className="currently-listening-artwork"
      src={src}
      alt=""
      width={600}
      height={600}
      onError={() => setFailed(true)}
    />
  )
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
          <GlassCard href={song.url} media={<Artwork src={song.artworkUrl} />} backdropSrc={song.artworkUrl}>
            <span className="currently-listening-kicker">Song of the month</span>
            <span className="currently-listening-card-title">
              {song.title}
              <ArrowUpRightIcon className="currently-listening-arrow" />
            </span>
            {playsDescription(song.artist, song.playCount) && (
              <p className="currently-listening-description">{playsDescription(song.artist, song.playCount)}</p>
            )}
          </GlassCard>
        )}
        {album && (
          <GlassCard href={album.url} media={<Artwork src={album.artworkUrl} />} backdropSrc={album.artworkUrl}>
            <span className="currently-listening-kicker">Album of the month</span>
            <span className="currently-listening-card-title">
              {album.title}
              <ArrowUpRightIcon className="currently-listening-arrow" />
            </span>
            {playsDescription(album.artist, album.playCount) && (
              <p className="currently-listening-description">{playsDescription(album.artist, album.playCount)}</p>
            )}
          </GlassCard>
        )}
      </div>
    </section>
  )
}
