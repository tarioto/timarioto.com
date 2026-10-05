import { describe, expect, test } from 'bun:test'
import { parseLocationName, parseWeather } from './useVisitorWeather'

const response = {
  current: {
    temperature_2m: 21.4,
    apparent_temperature: 20.1,
    weather_code: 0,
    relative_humidity_2m: 55,
    wind_speed_10m: 12.3,
    is_day: 1,
  },
  daily: {
    time: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'],
    weather_code: [0, 3, 61, 71, 95, 45],
    temperature_2m_max: [22, 23, 24, 25, 26, 27],
    temperature_2m_min: [10, 11, 12, 13, 14, 15],
  },
}

describe('parseWeather', () => {
  test('maps current conditions', () => {
    expect(parseWeather(response).current).toEqual({
      tempC: 21.4,
      feelsLikeC: 20.1,
      humidity: 55,
      windKph: 12.3,
      description: 'clear sky',
      icon: '☀️',
    })
  })

  test('uses the night icon when it is dark', () => {
    const night = parseWeather({ ...response, current: { ...response.current, is_day: 0 } })
    expect(night.current?.icon).toBe('🌙')
  })

  test('skips today and returns the next five days', () => {
    const { forecast } = parseWeather(response)
    expect(forecast.map((day) => day.date)).toEqual(response.daily.time.slice(1))
    expect(forecast[0]).toEqual({
      date: '2026-10-06',
      tempMinC: 11,
      tempMaxC: 23,
      description: 'overcast',
      icon: '☁️',
    })
  })

  test('caps the forecast at five days', () => {
    const daily = {
      time: [...response.daily.time, '2026-10-11'],
      weather_code: [...response.daily.weather_code, 0],
      temperature_2m_max: [...response.daily.temperature_2m_max, 28],
      temperature_2m_min: [...response.daily.temperature_2m_min, 16],
    }
    expect(parseWeather({ ...response, daily }).forecast).toHaveLength(5)
  })

  test('handles a response without data', () => {
    expect(parseWeather({})).toEqual({ current: null, forecast: [] })
    expect(parseWeather(null)).toEqual({ current: null, forecast: [] })
  })
})

describe('parseLocationName', () => {
  test('names the city with its country code', () => {
    expect(parseLocationName({ city: 'Brooklyn', locality: 'Park Slope', countryCode: 'US' })).toBe('Brooklyn, US')
  })

  test('falls back to the locality', () => {
    expect(parseLocationName({ city: '', locality: 'Park Slope', countryCode: 'US' })).toBe('Park Slope, US')
  })

  test('omits a missing country code', () => {
    expect(parseLocationName({ city: 'Brooklyn' })).toBe('Brooklyn')
  })

  test('returns null without a place name', () => {
    expect(parseLocationName({ countryCode: 'US' })).toBeNull()
    expect(parseLocationName(null)).toBeNull()
  })
})
