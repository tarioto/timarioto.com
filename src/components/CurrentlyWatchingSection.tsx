import { useEffect, useState } from 'react'
import { ArrowUpRightIcon } from '../icons'
import './CurrentlyWatchingSection.css'

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
    <section className="currently-watching-section" aria-label="Currently Watching">
      <h2 className="currently-watching-title">Currently Watching</h2>
      <div className="currently-watching-grid">
        {activity?.movie && (
          <a className="currently-watching-card" href={activity.movie.url} target="_blank" rel="noopener noreferrer">
            {activity.movie.posterUrl && (
              <img className="currently-watching-poster" src={activity.movie.posterUrl} alt="" width={342} height={513} />
            )}
            <div className="currently-watching-card-body">
              <span className="currently-watching-kicker">Last movie</span>
              <span className="currently-watching-card-title">
                {activity.movie.title} ({activity.movie.year})
                <ArrowUpRightIcon className="currently-watching-arrow" />
              </span>
            </div>
          </a>
        )}
        {activity?.show && (
          <a className="currently-watching-card" href={activity.show.url} target="_blank" rel="noopener noreferrer">
            {activity.show.posterUrl && (
              <img className="currently-watching-poster" src={activity.show.posterUrl} alt="" width={342} height={513} />
            )}
            <div className="currently-watching-card-body">
              <span className="currently-watching-kicker">Last episode</span>
              <span className="currently-watching-card-title">
                {activity.show.title} S{activity.show.season}E{activity.show.episode}
                <ArrowUpRightIcon className="currently-watching-arrow" />
              </span>
              <p className="currently-watching-description">{activity.show.episodeTitle}</p>
            </div>
          </a>
        )}
      </div>
    </section>
  )
}
