import { useJson } from '../hooks/useJson'
import MediaCard, { MediaCardSkeleton } from './MediaCard'
import PageSection from './PageSection'

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
  const { data: activity, loading } = useJson<TraktActivity>('/trakt.json')
  const movie = activity?.movie
  const show = activity?.show

  if (loading) {
    return (
      <PageSection className="currently-watching-section" title="Currently Watching" aria-busy="true">
        <div className="media-card-list">
          <MediaCardSkeleton aspect="poster" />
          <MediaCardSkeleton aspect="poster" description />
        </div>
      </PageSection>
    )
  }

  if (!movie && !show) return null

  return (
    <PageSection className="currently-watching-section" title="Currently Watching">
      <div className="media-card-list">
        {movie && (
          <MediaCard
            href={movie.url}
            imageSrc={movie.posterUrl}
            aspect="poster"
            fallback="🎬"
            kicker="Last movie"
            title={`${movie.title} (${movie.year})`}
          />
        )}
        {show && (
          <MediaCard
            href={show.url}
            imageSrc={show.posterUrl}
            aspect="poster"
            fallback="🎬"
            kicker="Last episode"
            title={`${show.title} S${show.season}E${show.episode}`}
            description={show.episodeTitle}
          />
        )}
      </div>
    </PageSection>
  )
}
