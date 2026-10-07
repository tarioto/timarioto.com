import { describe, expect, test } from 'bun:test'
import { sunDay, sunPosition } from './sunPosition'

const NEW_YORK = { lat: 40.7128, lon: -74.006 }

const minutesApart = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000

describe('sunPosition', () => {
  test('puts the sun overhead at the subsolar point', () => {
    // At the March equinox the sun is over the equator, overhead near noon at Greenwich.
    const { altDeg } = sunPosition(new Date('2026-03-20T12:07:00Z'), 0, 0)
    expect(altDeg).toBeGreaterThan(89)
  })

  test('sets in the west', () => {
    const { altDeg, azDeg } = sunPosition(new Date('2026-06-21T23:30:00Z'), NEW_YORK.lat, NEW_YORK.lon)
    expect(altDeg).toBeGreaterThan(0)
    expect(altDeg).toBeLessThan(15)
    expect(azDeg).toBeGreaterThan(270)
    expect(azDeg).toBeLessThan(310)
  })
})

describe('sunDay', () => {
  // Published NYC times for the June solstice: sunrise 5:25 am EDT, solar
  // noon 12:57 pm, sunset 8:31 pm, with the sun peaking at 72.7°.
  const solstice = sunDay(new Date('2026-06-21T16:00:00Z'), NEW_YORK.lat, NEW_YORK.lon)

  test('finds sunrise, solar noon, and sunset', () => {
    expect(minutesApart(solstice.rise!, new Date('2026-06-21T09:25:00Z'))).toBeLessThan(2)
    expect(minutesApart(solstice.transit.time, new Date('2026-06-21T16:57:00Z'))).toBeLessThan(2)
    expect(minutesApart(solstice.set!, new Date('2026-06-22T00:31:00Z'))).toBeLessThan(2)
  })

  test('peaks due south at 90° minus the latitude plus the tilt', () => {
    expect(solstice.transit.altDeg).toBeCloseTo(72.7, 0)
    expect(solstice.transit.azDeg).toBeCloseTo(180, 0)
  })

  test('tracks the sun from rise to set', () => {
    const { path, rise, set } = solstice
    expect(path[0].time).toEqual(rise!)
    expect(path[path.length - 1].time).toEqual(set!)
    expect(path[0].azDeg).toBeLessThan(90) // rises north of east in summer
    for (const point of path) expect(point.altDeg).toBeGreaterThan(-1)
  })

  test("uses the nearest solar noon, so after midnight it's still the coming day", () => {
    const early = sunDay(new Date('2026-06-21T05:00:00Z'), NEW_YORK.lat, NEW_YORK.lon)
    expect(minutesApart(early.transit.time, solstice.transit.time)).toBeLessThan(2)
  })

  test('has no rise or set under a midnight sun, and tracks the whole day', () => {
    const tromso = sunDay(new Date('2026-06-21T12:00:00Z'), 69.65, 18.96)
    expect(tromso.rise).toBeNull()
    expect(tromso.set).toBeNull()
    expect(minutesApart(tromso.path[0].time, tromso.path[tromso.path.length - 1].time)).toBeCloseTo(24 * 60, -1)
  })

  test('has no path in polar night', () => {
    const tromso = sunDay(new Date('2026-12-21T12:00:00Z'), 69.65, 18.96)
    expect(tromso.transit.altDeg).toBeLessThan(0)
    expect(tromso.rise).toBeNull()
    expect(tromso.set).toBeNull()
    expect(tromso.path).toEqual([])
  })
})
