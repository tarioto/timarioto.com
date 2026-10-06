import { describe, expect, test } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import { fetchesSettled, stubFetch } from '../test/stubs'
import CurrentlyListeningSection, { playsDescription } from './CurrentlyListeningSection'

const song = {
  updatedAt: '2026-10-01T00:00:00Z',
  month: '2026-09',
  title: 'Weird Fishes',
  artist: 'Radiohead',
  artworkUrl: 'https://example.com/song.jpg',
  url: 'https://music.apple.com/song',
  playCount: 12,
}

const album = {
  ...song,
  title: 'In Rainbows',
  artworkUrl: null,
  url: 'https://music.apple.com/album',
  playCount: 1,
}

describe('playsDescription', () => {
  test('joins the artist and play count', () => {
    expect(playsDescription('Radiohead', 12)).toBe('Radiohead · 12 plays')
  })

  test('uses the singular for one play', () => {
    expect(playsDescription('Radiohead', 1)).toBe('Radiohead · 1 play')
  })

  test('shows whichever part is present', () => {
    expect(playsDescription(null, 3)).toBe('3 plays')
    expect(playsDescription('Radiohead', null)).toBe('Radiohead')
    expect(playsDescription('Radiohead', 0)).toBe('Radiohead')
  })

  test('returns null when there is nothing to show', () => {
    expect(playsDescription(null, null)).toBeNull()
  })
})

describe('CurrentlyListeningSection', () => {
  test('shows the song and album of the month', async () => {
    const fetchSpy = stubFetch({ '/song.json': song, '/album.json': album })
    render(<CurrentlyListeningSection />)
    await fetchesSettled(fetchSpy)

    const songLink = screen.getByRole('link', { name: /Weird Fishes/ })
    expect(songLink.getAttribute('href')).toBe(song.url)
    expect(screen.getByText('Radiohead · 12 plays')).toBeDefined()

    const albumLink = screen.getByRole('link', { name: /In Rainbows/ })
    expect(albumLink.getAttribute('href')).toBe(album.url)
    expect(screen.getByText('Radiohead · 1 play')).toBeDefined()
  })

  test('shows just the song when there is no album yet', async () => {
    const fetchSpy = stubFetch({ '/song.json': song })
    render(<CurrentlyListeningSection />)
    await fetchesSettled(fetchSpy)
    expect(screen.getByText('Weird Fishes')).toBeDefined()
    expect(screen.queryByText('Album of the month')).toBeNull()
  })

  test('holds a placeholder until the data loads', async () => {
    const fetchSpy = stubFetch({ '/song.json': song, '/album.json': album })
    const { container } = render(<CurrentlyListeningSection />)
    expect(screen.getByRole('region', { name: 'Currently Listening' }).getAttribute('aria-busy')).toBe('true')
    expect(container.querySelectorAll('.media-card-image.skeleton')).toHaveLength(2)
    expect(screen.queryAllByRole('link')).toEqual([])

    await fetchesSettled(fetchSpy)
    expect(container.querySelector('[aria-busy]')).toBeNull()
  })

  test('renders nothing without data', async () => {
    const fetchSpy = stubFetch({})
    const { container } = render(<CurrentlyListeningSection />)
    await fetchesSettled(fetchSpy)
    expect(container.innerHTML).toBe('')
  })

  test('swaps in a placeholder when the artwork is missing or fails to load', async () => {
    const fetchSpy = stubFetch({ '/song.json': song, '/album.json': album })
    const { container } = render(<CurrentlyListeningSection />)
    await fetchesSettled(fetchSpy)
    // The album has no artwork, so only the song's image is rendered.
    expect(container.querySelectorAll('.media-card-image-fallback')).toHaveLength(1)

    fireEvent.error(container.querySelector('img.media-card-image')!)
    expect(container.querySelectorAll('.media-card-image-fallback')).toHaveLength(2)
  })
})
