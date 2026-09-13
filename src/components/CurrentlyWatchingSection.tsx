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

export default function CurrentlyWatchingSection() {
  const [activity, setActivity] = useState<TraktActivity | null>(null)

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

    return () => {
      cancelled = true
    }
  }, [])

  if (!activity?.movie && !activity?.show) return null

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
      </div>
    </section>
  )
}
