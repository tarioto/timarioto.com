import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test'
import { stubFetch } from '../../src/test/stubs'
import { mockS3 } from '../mockS3'

const puts = mockS3()
const { dailyForecast, handler } = await import('./index.mjs')

function entry(dtTxt: string, tempMin: number, tempMax: number, description = 'clear sky', icon = '01d') {
  return { dt_txt: dtTxt, main: { temp_min: tempMin, temp_max: tempMax }, weather: [{ description, icon }] }
}

describe('dailyForecast', () => {
  test('groups 3-hour entries by day with the min and max temperatures', () => {
    const list = [entry('2026-10-06 00:00:00', 8.4, 9.6), entry('2026-10-06 12:00:00', 14.2, 18.7)]
    expect(dailyForecast(list, '2026-10-05')).toEqual([
      { date: '2026-10-06', tempMinC: 8, tempMaxC: 19, description: 'clear sky', icon: '01d' },
    ])
  })

  test('skips the given date', () => {
    const list = [entry('2026-10-05 21:00:00', 10, 12), entry('2026-10-06 09:00:00', 11, 13)]
    expect(dailyForecast(list, '2026-10-05').map((day: { date: string }) => day.date)).toEqual(['2026-10-06'])
  })

  test('describes each day by the entry closest to noon', () => {
    const list = [
      entry('2026-10-06 03:00:00', 10, 12, 'mist', '50n'),
      entry('2026-10-06 15:00:00', 10, 12, 'light rain', '10d'),
      entry('2026-10-06 21:00:00', 10, 12, 'clear sky', '01n'),
    ]
    expect(dailyForecast(list, '')[0]).toMatchObject({ description: 'light rain', icon: '10d' })
  })

  test('caps the forecast at five days', () => {
    const list = ['06', '07', '08', '09', '10', '11'].map((day) => entry(`2026-10-${day} 12:00:00`, 10, 12))
    expect(dailyForecast(list, '')).toHaveLength(5)
  })

  test('tolerates entries without weather details', () => {
    const list = [{ dt_txt: '2026-10-06 12:00:00', main: { temp_min: 10, temp_max: 12 }, weather: [] }]
    expect(dailyForecast(list, '')[0]).toMatchObject({ description: '', icon: null })
  })
})

const current = {
  name: 'Brooklyn',
  sys: { country: 'US' },
  coord: { lat: 40.68, lon: -73.97 },
  // 2026-10-05 18:00 UTC
  dt: 1791223200,
  main: { temp: 17.6, feels_like: 17.2, humidity: 64 },
  wind: { speed: 5 },
  weather: [{ description: 'broken clouds', icon: '04d' }],
}

const forecast = {
  list: [entry('2026-10-05 21:00:00', 15, 16), entry('2026-10-06 12:00:00', 12.2, 19.8, 'light rain', '10d')],
}

describe('weather poller', () => {
  const env = { ...process.env }

  beforeEach(() => {
    puts.length = 0
    Object.assign(process.env, { WEATHER_API_KEY: 'key', WEATHER_ZIP: '11215,us', SITE_BUCKET: 'site-bucket' })
    setSystemTime(new Date('2026-10-05T18:05:00Z'))
  })

  afterEach(() => {
    process.env = { ...env }
    setSystemTime()
  })

  test('writes the current weather and forecast to weather.json', async () => {
    stubFetch({ '/weather?': current, '/forecast?': forecast })
    await handler()

    expect(puts).toHaveLength(1)
    const [put] = puts
    expect(put).toMatchObject({
      Bucket: 'site-bucket',
      Key: 'weather.json',
      ContentType: 'application/json',
      CacheControl: 'public, max-age=1800',
    })
    expect(JSON.parse(put!.Body)).toEqual({
      updatedAt: '2026-10-05T18:05:00.000Z',
      location: { name: 'Brooklyn', country: 'US' },
      current: {
        tempC: 18,
        feelsLikeC: 17,
        description: 'broken clouds',
        icon: '04d',
        humidity: 64,
        // 5 m/s
        windKph: 18,
      },
      // Today's remaining entries are left out.
      forecast: [{ date: '2026-10-06', tempMinC: 12, tempMaxC: 20, description: 'light rain', icon: '10d' }],
    })
  })

  test('asks for the forecast where the current weather was reported', async () => {
    const fetchSpy = stubFetch({ '/weather?': current, '/forecast?': forecast })
    await handler()
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('zip=11215,us&units=metric&appid=key')
    expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('lat=40.68&lon=-73.97')
  })

  test('leaves the country empty when OpenWeatherMap omits it', async () => {
    stubFetch({ '/weather?': { ...current, sys: undefined }, '/forecast?': forecast })
    await handler()
    expect(JSON.parse(puts[0]!.Body).location).toEqual({ name: 'Brooklyn', country: null })
  })

  test('fails without writing when the current weather request fails', async () => {
    stubFetch({ '/weather?': new Response('bad key', { status: 401, statusText: 'Unauthorized' }) })
    await expect(handler()).rejects.toThrow('current weather request failed: 401 Unauthorized - bad key')
    expect(puts).toEqual([])
  })

  test('fails without writing when the forecast request fails', async () => {
    stubFetch({ '/weather?': current, '/forecast?': new Response('down', { status: 503, statusText: 'Unavailable' }) })
    await expect(handler()).rejects.toThrow('forecast request failed: 503 Unavailable - down')
    expect(puts).toEqual([])
  })
})
