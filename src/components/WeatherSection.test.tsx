import { afterEach, describe, expect, jest, test } from 'bun:test'
import { act, render, screen } from '@testing-library/react'
import { PROMPT_TIMEOUT_MS } from '../hooks/useVisitorLocation'
import { answerGeolocation, fetchesSettled, openMeteoResponse, stubFetch, stubGeolocation } from '../test/stubs'
import WeatherSection from './WeatherSection'

let restore = () => {}
afterEach(() => {
  restore()
  jest.useRealTimers()
})

describe('WeatherSection', () => {
  test("shows the current weather and forecast for the visitor's city", async () => {
    restore = stubGeolocation({ lat: 51.5, lon: -0.12 })
    const fetchSpy = stubFetch({
      'api.open-meteo.com': openMeteoResponse,
      'api.bigdatacloud.net': { city: 'London', countryCode: 'GB' },
    })
    const { container } = render(<WeatherSection />)
    await fetchesSettled(fetchSpy)

    expect(screen.getByText('20°C')).toBeDefined()
    expect(screen.getByText('clear sky in London, GB')).toBeDefined()
    const cards = container.querySelectorAll('.weather-section-forecast-card')
    expect(cards).toHaveLength(5)
    // 23.6° high and 11.4° low round to whole degrees.
    expect(cards[0]?.querySelector('.weather-section-forecast-temps')?.textContent).toBe('24° 11°')
  })

  test('says "near you" without a place name', async () => {
    restore = stubGeolocation({ lat: 51.5, lon: -0.12 })
    const fetchSpy = stubFetch({ 'api.open-meteo.com': openMeteoResponse, 'api.bigdatacloud.net': {} })
    render(<WeatherSection />)
    await fetchesSettled(fetchSpy)
    expect(screen.getByText('clear sky near you')).toBeDefined()
  })

  test('holds a placeholder while locating the visitor', () => {
    restore = stubGeolocation('pending')
    const { container } = render(<WeatherSection />)
    expect(screen.getByRole('region', { name: 'Weather' }).getAttribute('aria-busy')).toBe('true')
    const cards = container.querySelectorAll('.weather-section-forecast-card')
    expect(cards).toHaveLength(5)
    expect(cards[0]?.querySelector('.glass-backing')).not.toBeNull()
    expect(cards[0]?.querySelectorAll('.skeleton-text')).toHaveLength(3)
  })

  test('keeps the same panel and forecast cards when the weather loads', async () => {
    restore = stubGeolocation({ lat: 51.5, lon: -0.12 })
    const fetchSpy = stubFetch({ 'api.open-meteo.com': openMeteoResponse, 'api.bigdatacloud.net': {} })
    const { container } = render(<WeatherSection />)
    const panel = container.querySelector('section')
    const firstCard = container.querySelector('.weather-section-forecast-card')
    await fetchesSettled(fetchSpy)

    expect(container.querySelector('section')).toBe(panel)
    expect(panel?.hasAttribute('aria-busy')).toBe(false)
    expect(container.querySelector('.weather-section-forecast-card')).toBe(firstCard)
    expect(container.querySelector('.skeleton-text')).toBeNull()
  })

  test('says no location is available when the prompt goes unanswered, in the same panel', async () => {
    jest.useFakeTimers()
    restore = stubGeolocation('pending')
    const fetchSpy = stubFetch({ 'api.open-meteo.com': openMeteoResponse, 'api.bigdatacloud.net': {} })
    const { container } = render(<WeatherSection />)
    const panel = container.querySelector('section')
    act(() => jest.advanceTimersByTime(PROMPT_TIMEOUT_MS))

    expect(screen.getByText('No location available')).toBeDefined()
    expect(screen.getByText('🌞')).toBeDefined()
    expect(container.querySelector('.weather-section-forecast')).toBeNull()
    expect(container.querySelector('section')).toBe(panel)
    expect(panel?.hasAttribute('aria-busy')).toBe(false)

    // A late answer still brings in the weather.
    jest.useRealTimers()
    answerGeolocation({ lat: 51.5, lon: -0.12 })
    await fetchesSettled(fetchSpy)
    expect(screen.getByText('20°C')).toBeDefined()
    expect(screen.queryByText('No location available')).toBeNull()
  })

  test('renders nothing when the weather request fails', async () => {
    restore = stubGeolocation('denied')
    const fetchSpy = stubFetch({})
    const { container } = render(<WeatherSection />)
    await fetchesSettled(fetchSpy)
    expect(container.innerHTML).toBe('')
  })
})
