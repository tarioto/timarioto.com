import { describe, expect, mock, test } from 'bun:test'

// The Lambda runtime provides the AWS SDK; it isn't installed locally.
mock.module('@aws-sdk/client-s3', () => ({ S3Client: class {}, PutObjectCommand: class {} }))
const { episodeUrl, movieUrl } = await import('./index.mjs')

describe('Trakt URLs', () => {
  test('links a movie by its slug', () => {
    expect(movieUrl('dune-part-two-2024')).toBe('https://trakt.tv/movies/dune-part-two-2024')
  })

  test('links an episode by show slug, season and number', () => {
    expect(episodeUrl('severance', 2, 10)).toBe('https://trakt.tv/shows/severance/seasons/2/episodes/10')
  })
})
