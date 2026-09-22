import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const TRAKT_API = 'https://api.trakt.tv'
const TMDB_API = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w342'

const s3 = new S3Client({})

function movieUrl(slug) {
  return `https://trakt.tv/movies/${slug}`
}

function episodeUrl(showSlug, season, episode) {
  return `https://trakt.tv/shows/${showSlug}/seasons/${season}/episodes/${episode}`
}

async function fetchTmdbPoster(kind, tmdbId, apiKey) {
  if (!tmdbId || !apiKey) return null

  const path = kind === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`
  const response = await fetch(`${TMDB_API}/${path}?api_key=${apiKey}`)
  if (!response.ok) return null

  const data = await response.json()
  return data.poster_path ? `${TMDB_IMAGE}${data.poster_path}` : null
}

export const handler = async () => {
  const username = process.env.TRAKT_USERNAME
  const clientId = process.env.TRAKT_CLIENT_ID
  const tmdbApiKey = process.env.TMDB_API_KEY
  const bucket = process.env.SITE_BUCKET

  const response = await fetch(`${TRAKT_API}/users/${username}/history?limit=10`, {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
      'User-Agent': 'timarioto.com-trakt-poller/1.0 (+https://timarioto.com)',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Trakt history request failed: ${response.status} ${response.statusText} - ${body}`)
  }

  const history = await response.json()

  const movieItem = history.find((item) => item.type === 'movie')
  const episodeItem = history.find((item) => item.type === 'episode')

  const [moviePoster, showPoster] = await Promise.all([
    movieItem ? fetchTmdbPoster('movie', movieItem.movie.ids.tmdb, tmdbApiKey) : null,
    episodeItem ? fetchTmdbPoster('tv', episodeItem.show.ids.tmdb, tmdbApiKey) : null,
  ])

  const payload = {
    updatedAt: new Date().toISOString(),
    movie: movieItem
      ? {
          title: movieItem.movie.title,
          year: movieItem.movie.year,
          watchedAt: movieItem.watched_at,
          url: movieUrl(movieItem.movie.ids.slug),
          posterUrl: moviePoster,
        }
      : null,
    show: episodeItem
      ? {
          title: episodeItem.show.title,
          season: episodeItem.episode.season,
          episode: episodeItem.episode.number,
          episodeTitle: episodeItem.episode.title,
          watchedAt: episodeItem.watched_at,
          url: episodeUrl(episodeItem.show.ids.slug, episodeItem.episode.season, episodeItem.episode.number),
          posterUrl: showPoster,
        }
      : null,
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: 'trakt.json',
      Body: JSON.stringify(payload),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=300',
    }),
  )
}
