import { describe, expect, test } from 'bun:test'
import { describeWeatherCode } from './weatherCode'

describe('describeWeatherCode', () => {
  test.each([
    [0, '☀️', '🌙'],
    [1, '🌤️', '🌙'],
    [2, '⛅', '☁️'],
  ])('code %i swaps its icon between day and night', (code, day, night) => {
    expect(describeWeatherCode(code, true).icon).toBe(day)
    expect(describeWeatherCode(code, false).icon).toBe(night)
  })

  test('uses the same icon day and night for overcast skies', () => {
    expect(describeWeatherCode(3, true)).toEqual(describeWeatherCode(3, false))
  })

  test.each([
    [45, 48, 'fog'],
    [56, 57, 'freezing drizzle'],
    [66, 67, 'freezing rain'],
    [80, 81, 'rain showers'],
    [96, 99, 'thunderstorm with hail'],
  ])('codes %i and %i both mean %s', (a, b, description) => {
    expect(describeWeatherCode(a, true).description).toBe(description)
    expect(describeWeatherCode(b, true)).toEqual(describeWeatherCode(a, true))
  })

  test.each([
    [51, 'light drizzle'],
    [53, 'drizzle'],
    [55, 'heavy drizzle'],
    [61, 'light rain'],
    [63, 'rain'],
    [65, 'heavy rain'],
    [71, 'light snow'],
    [73, 'snow'],
    [75, 'heavy snow'],
    [77, 'snow grains'],
    [82, 'heavy rain showers'],
    [85, 'snow showers'],
    [86, 'heavy snow showers'],
    [95, 'thunderstorm'],
  ])('code %i means %s', (code, description) => {
    expect(describeWeatherCode(code, true).description).toBe(description)
  })

  test('falls back for codes outside the WMO table', () => {
    expect(describeWeatherCode(42, true)).toEqual({ description: 'unknown', icon: '🌡️' })
  })
})
