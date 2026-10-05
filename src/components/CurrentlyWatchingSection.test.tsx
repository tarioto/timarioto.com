import { describe, expect, test } from 'bun:test'
import { fireEvent, render, screen } from '@testing-library/react'
import { fetchesSettled, stubFetch } from '../test/stubs'
import CurrentlyWatchingSection from './CurrentlyWatchingSection'

const activity = {
  updatedAt: '2026-10-05T00:00:00Z',
  movie: {
    title: 'Dune: Part Two',
    year: 2024,
    watchedAt: '2026-10-04T20:00:00Z',
    url: 'https://trakt.tv/movies/dune-part-two-2024',
    posterUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
  },
  show: {
    title: 'Severance',
    season: 2,
    episode: 10,
    episodeTitle: 'Cold Harbor',
    watchedAt: '2026-10-03T20:00:00Z',
    url: 'https://trakt.tv/shows/severance/seasons/2/episodes/10',
    posterUrl: null,
  },
}

describe('CurrentlyWatchingSection', () => {
  test('shows the last movie and episode', async () => {
    const fetchSpy = stubFetch({ '/trakt.json': activity })
    render(<CurrentlyWatchingSection />)
    await fetchesSettled(fetchSpy)

    const movie = screen.getByRole('link', { name: /Dune: Part Two \(2024\)/ })
    expect(movie.getAttribute('href')).toBe(activity.movie.url)
    const show = screen.getByRole('link', { name: /Severance S2E10/ })
    expect(show.getAttribute('href')).toBe(activity.show.url)
    expect(screen.getByText('Cold Harbor')).toBeDefined()
  })

  test('shows just the episode when there is no movie', async () => {
    const fetchSpy = stubFetch({ '/trakt.json': { ...activity, movie: null } })
    render(<CurrentlyWatchingSection />)
    await fetchesSettled(fetchSpy)
    expect(screen.getByText('Cold Harbor')).toBeDefined()
    expect(screen.queryByText('Last movie')).toBeNull()
  })

  test('renders nothing when the poller has not run', async () => {
    const fetchSpy = stubFetch({})
    const { container } = render(<CurrentlyWatchingSection />)
    await fetchesSettled(fetchSpy)
    expect(container.innerHTML).toBe('')
  })

  test('swaps in a placeholder when a poster is missing or fails to load', async () => {
    const fetchSpy = stubFetch({ '/trakt.json': activity })
    const { container } = render(<CurrentlyWatchingSection />)
    await fetchesSettled(fetchSpy)
    expect(container.querySelectorAll('.media-card-image-fallback')).toHaveLength(1)

    fireEvent.error(container.querySelector('img.media-card-image')!)
    expect(container.querySelectorAll('.media-card-image-fallback')).toHaveLength(2)
  })
})
