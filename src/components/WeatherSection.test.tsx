import { afterEach, describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { fetchesSettled, openMeteoResponse, stubFetch, stubGeolocation } from '../test/stubs'
import WeatherSection from './WeatherSection'

let restore = () => {}
afterEach(() => restore())

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

  test('renders nothing while locating the visitor', () => {
    restore = stubGeolocation('pending')
    const { container } = render(<WeatherSection />)
    expect(container.innerHTML).toBe('')
  })

  test('renders nothing when the weather request fails', async () => {
    restore = stubGeolocation('denied')
    const fetchSpy = stubFetch({})
    const { container } = render(<WeatherSection />)
    await fetchesSettled(fetchSpy)
    expect(container.innerHTML).toBe('')
  })
})
