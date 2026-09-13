import { useEffect, useState } from 'react'
import { ArrowUpRightIcon } from '../icons'
import styles from './CurrentlyWatchingSection.module.css'

interface WatchedMovie {
  title: string
  year: number
  watchedAt: string
  url: string
  posterUrl: string | null
}

interface WatchedEpisode {
  title: string
  season: number
  episode: number
  episodeTitle: string
  watchedAt: string
  url: string
  posterUrl: string | null
}

interface TraktActivity {
  updatedAt: string
  movie: WatchedMovie | null
  show: WatchedEpisode | null
}

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

export default function CurrentlyWatchingSection() {
  const [activity, setActivity] = useState<TraktActivity | null>(null)
  const [song, setSong] = useState<SongOfTheMonth | null>(null)
  const [album, setAlbum] = useState<AlbumOfTheMonth | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/trakt.json')
      .then((res) => res.json())
      .then((data: TraktActivity) => {
        if (!cancelled) setActivity(data)
      })
      .catch(() => {
        // No data yet (e.g. the poller hasn't run, or CloudFront served the
        // SPA fallback instead of a real trakt.json) — render nothing.
      })

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

  if (!activity?.movie && !activity?.show && !song && !album) return null

  return (
    <section className={styles.section} aria-label="Currently Watching">
      <h2 className={styles.title}>Currently Watching</h2>
      <div className={styles.grid}>
        {activity?.movie && (
          <a className={styles.card} href={activity.movie.url} target="_blank" rel="noopener noreferrer">
            {activity.movie.posterUrl && (
              <img className={styles.poster} src={activity.movie.posterUrl} alt="" width={342} height={513} />
            )}
            <div className={styles.cardBody}>
              <span className={styles.kicker}>Last movie</span>
              <span className={styles.cardTitle}>
                {activity.movie.title} ({activity.movie.year})
                <ArrowUpRightIcon className={styles.arrow} />
              </span>
            </div>
          </a>
        )}
        {activity?.show && (
          <a className={styles.card} href={activity.show.url} target="_blank" rel="noopener noreferrer">
            {activity.show.posterUrl && (
              <img className={styles.poster} src={activity.show.posterUrl} alt="" width={342} height={513} />
            )}
            <div className={styles.cardBody}>
              <span className={styles.kicker}>Last episode</span>
              <span className={styles.cardTitle}>
                {activity.show.title} S{activity.show.season}E{activity.show.episode}
                <ArrowUpRightIcon className={styles.arrow} />
              </span>
              <p className={styles.description}>{activity.show.episodeTitle}</p>
            </div>
          </a>
        )}
        {song && (
          <a className={styles.card} href={song.url} target="_blank" rel="noopener noreferrer">
            {song.artworkUrl && (
              <img className={styles.artwork} src={song.artworkUrl} alt="" width={300} height={300} />
            )}
            <div className={styles.cardBody}>
              <span className={styles.kicker}>Song of the month</span>
              <span className={styles.cardTitle}>
                {song.title}
                <ArrowUpRightIcon className={styles.arrow} />
              </span>
              {playsDescription(song.artist, song.playCount) && (
                <p className={styles.description}>{playsDescription(song.artist, song.playCount)}</p>
              )}
            </div>
          </a>
        )}
        {album && (
          <a className={styles.card} href={album.url} target="_blank" rel="noopener noreferrer">
            {album.artworkUrl && (
              <img className={styles.artwork} src={album.artworkUrl} alt="" width={300} height={300} />
            )}
            <div className={styles.cardBody}>
              <span className={styles.kicker}>Album of the month</span>
              <span className={styles.cardTitle}>
                {album.title}
                <ArrowUpRightIcon className={styles.arrow} />
              </span>
              {playsDescription(album.artist, album.playCount) && (
                <p className={styles.description}>{playsDescription(album.artist, album.playCount)}</p>
              )}
            </div>
          </a>
        )}
      </div>
    </section>
  )
}
