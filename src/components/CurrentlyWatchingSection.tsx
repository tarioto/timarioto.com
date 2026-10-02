import { useEffect, useState } from 'react'
import { ArrowUpRightIcon } from '../icons'
import './CurrentlyWatchingSection.css'
import GlassBacking from './GlassBacking'
import GlassCard from './GlassCard'

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

// Poster with a clapperboard placeholder for when Trakt has no poster for the
// title or the image fails to load.
function Poster({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="currently-watching-poster currently-watching-poster-fallback" aria-hidden="true">
        🎬
      </div>
    )
  }

  return (
    <img
      className="currently-watching-poster"
      src={src}
      alt=""
      width={342}
      height={513}
      onError={() => setFailed(true)}
    />
  )
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
    <section className="currently-watching-section page-section" aria-label="Currently Watching">
      <GlassBacking />
      <h2 className="currently-watching-title">Currently Watching</h2>
      <div className="currently-watching-grid">
        {activity?.movie && (
          <GlassCard
            href={activity.movie.url}
            media={<Poster src={activity.movie.posterUrl} />}
            backdropSrc={activity.movie.posterUrl}
          >
            <span className="currently-watching-kicker">Last movie</span>
            <span className="currently-watching-card-title">
              {activity.movie.title} ({activity.movie.year})
              <ArrowUpRightIcon className="currently-watching-arrow" />
            </span>
          </GlassCard>
        )}
        {activity?.show && (
          <GlassCard
            href={activity.show.url}
            media={<Poster src={activity.show.posterUrl} />}
            backdropSrc={activity.show.posterUrl}
          >
            <span className="currently-watching-kicker">Last episode</span>
            <span className="currently-watching-card-title">
              {activity.show.title} S{activity.show.season}E{activity.show.episode}
              <ArrowUpRightIcon className="currently-watching-arrow" />
            </span>
            <p className="currently-watching-description">{activity.show.episodeTitle}</p>
          </GlassCard>
        )}
      </div>
    </section>
  )
}
