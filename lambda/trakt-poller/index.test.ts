import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test'
import { stubFetch } from '../../src/test/stubs'
import { mockS3 } from '../mockS3'

const puts = mockS3()
const { episodeUrl, handler, movieUrl } = await import('./index.mjs')

describe('Trakt URLs', () => {
  test('links a movie by its slug', () => {
    expect(movieUrl('dune-part-two-2024')).toBe('https://trakt.tv/movies/dune-part-two-2024')
  })

  test('links an episode by show slug, season and number', () => {
    expect(episodeUrl('severance', 2, 10)).toBe('https://trakt.tv/shows/severance/seasons/2/episodes/10')
  })
})

const movieHistory = [
  {
    watched_at: '2026-10-04T20:00:00.000Z',
    movie: { title: 'Dune: Part Two', year: 2024, ids: { slug: 'dune-part-two-2024', tmdb: 693134 } },
  },
]

const episodeHistory = [
  {
    watched_at: '2026-10-03T21:00:00.000Z',
    episode: { season: 2, number: 10, title: 'Cold Harbor' },
    show: { title: 'Severance', ids: { slug: 'severance', tmdb: 95396 } },
  },
]

const routes = {
  '/history/movies': movieHistory,
  '/history/episodes': episodeHistory,
  '/movie/693134': { poster_path: '/dune.jpg' },
  '/tv/95396': { poster_path: '/severance.jpg' },
}

describe('trakt poller', () => {
  const env = { ...process.env }

  beforeEach(() => {
    puts.length = 0
    Object.assign(process.env, {
      TRAKT_USERNAME: 'tim',
      TRAKT_CLIENT_ID: 'client-id',
      TMDB_API_KEY: 'tmdb-key',
      SITE_BUCKET: 'site-bucket',
    })
    setSystemTime(new Date('2026-10-05T12:00:00Z'))
  })

  afterEach(() => {
    process.env = { ...env }
    setSystemTime()
  })

  test('writes the last movie and episode, with posters, to trakt.json', async () => {
    stubFetch(routes)
    await handler()

    expect(puts).toHaveLength(1)
    const [put] = puts
    expect(put).toMatchObject({
      Bucket: 'site-bucket',
      Key: 'trakt.json',
      ContentType: 'application/json',
      CacheControl: 'public, max-age=300',
    })
    expect(JSON.parse(put!.Body)).toEqual({
      updatedAt: '2026-10-05T12:00:00.000Z',
      movie: {
        title: 'Dune: Part Two',
        year: 2024,
        watchedAt: '2026-10-04T20:00:00.000Z',
        url: 'https://trakt.tv/movies/dune-part-two-2024',
        posterUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
      },
      show: {
        title: 'Severance',
        season: 2,
        episode: 10,
        episodeTitle: 'Cold Harbor',
        watchedAt: '2026-10-03T21:00:00.000Z',
        url: 'https://trakt.tv/shows/severance/seasons/2/episodes/10',
        posterUrl: 'https://image.tmdb.org/t/p/w342/severance.jpg',
      },
    })
  })

  test("authenticates to Trakt and reads the user's history", async () => {
    const fetchSpy = stubFetch(routes)
    await handler()
    expect(fetchSpy).toHaveBeenCalledWith('https://api.trakt.tv/users/tim/history/movies?limit=1', {
      headers: expect.objectContaining({ 'trakt-api-key': 'client-id', 'trakt-api-version': '2' }),
    })
  })

  test('writes nulls when nothing has been watched', async () => {
    stubFetch({ '/history/movies': [], '/history/episodes': [] })
    await handler()
    const payload = JSON.parse(puts[0]!.Body)
    expect(payload.movie).toBeNull()
    expect(payload.show).toBeNull()
  })

  test('skips posters without a TMDB key', async () => {
    delete process.env.TMDB_API_KEY
    stubFetch({ '/history/movies': movieHistory, '/history/episodes': episodeHistory })
    await handler()
    const payload = JSON.parse(puts[0]!.Body)
    expect(payload.movie.posterUrl).toBeNull()
    expect(payload.show.posterUrl).toBeNull()
  })

  test('skips posters TMDB fails to return', async () => {
    stubFetch({
      ...routes,
      '/movie/693134': new Response('not found', { status: 404 }),
      '/tv/95396': { poster_path: null },
    })
    await handler()
    const payload = JSON.parse(puts[0]!.Body)
    expect(payload.movie.posterUrl).toBeNull()
    expect(payload.show.posterUrl).toBeNull()
  })

  test('fails without writing when Trakt rejects the request', async () => {
    stubFetch({
      ...routes,
      '/history/episodes': new Response('rate limited', { status: 429, statusText: 'Too Many Requests' }),
    })
    await expect(handler()).rejects.toThrow(
      'Trakt episodes history request failed: 429 Too Many Requests - rate limited',
    )
    expect(puts).toEqual([])
  })
})
