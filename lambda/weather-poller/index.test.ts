import { describe, expect, mock, test } from 'bun:test'

// The Lambda runtime provides the AWS SDK; it isn't installed locally.
mock.module('@aws-sdk/client-s3', () => ({ S3Client: class {}, PutObjectCommand: class {} }))
const { dailyForecast } = await import('./index.mjs')

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
    expect(dailyForecast(list, '2026-10-05').map((day) => day.date)).toEqual(['2026-10-06'])
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
