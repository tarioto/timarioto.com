import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const TRAKT_API = 'https://api.trakt.tv'

const s3 = new S3Client({})

function movieUrl(slug) {
  return `https://trakt.tv/movies/${slug}`
}

function episodeUrl(showSlug, season, episode) {
  return `https://trakt.tv/shows/${showSlug}/seasons/${season}/episodes/${episode}`
}

export const handler = async () => {
  const username = process.env.TRAKT_USERNAME
  const clientId = process.env.TRAKT_CLIENT_ID
  const bucket = process.env.SITE_BUCKET

  const response = await fetch(`${TRAKT_API}/users/${username}/history?limit=10`, {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': clientId,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Trakt history request failed: ${response.status} ${response.statusText} - ${body}`)
  }

  const history = await response.json()

  const movieItem = history.find((item) => item.type === 'movie')
  const episodeItem = history.find((item) => item.type === 'episode')

  const payload = {
    updatedAt: new Date().toISOString(),
    movie: movieItem
      ? {
          title: movieItem.movie.title,
          year: movieItem.movie.year,
          watchedAt: movieItem.watched_at,
          url: movieUrl(movieItem.movie.ids.slug),
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
