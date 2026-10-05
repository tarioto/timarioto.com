import { describe, expect, test } from 'bun:test'
import { equatorialToHorizontal, projectToDome } from './skyPosition'

describe('projectToDome', () => {
  test('puts the zenith at the center', () => {
    const point = projectToDome(90, 123, 100)
    expect(point.x).toBeCloseTo(0)
    expect(point.y).toBeCloseTo(0)
    expect(point.visible).toBe(true)
  })

  test('puts north at the top and east to the right of the horizon', () => {
    const north = projectToDome(0, 0, 100)
    expect(north.x).toBeCloseTo(0)
    expect(north.y).toBeCloseTo(-100)
    const east = projectToDome(0, 90, 100)
    expect(east.x).toBeCloseTo(100)
    expect(east.y).toBeCloseTo(0)
  })

  test('hides points at or below the horizon', () => {
    expect(projectToDome(0, 0, 1).visible).toBe(false)
    expect(projectToDome(-10, 0, 1).visible).toBe(false)
    expect(projectToDome(0.1, 0, 1).visible).toBe(true)
  })
})

describe('equatorialToHorizontal', () => {
  const date = new Date('2026-01-15T03:00:00Z')

  test('puts the celestial pole due north at the observer latitude', () => {
    const { altDeg, azDeg } = equatorialToHorizontal(0, 90, 40.7128, -74.006, date)
    expect(altDeg).toBeCloseTo(40.7128, 4)
    expect(azDeg % 360).toBeCloseTo(0, 4)
  })

  test('culminates due south at 90° minus the latitude for a star on the equator', () => {
    let highest = { altDeg: -90, azDeg: 0 }
    for (let ra = 0; ra < 360; ra += 0.01) {
      const position = equatorialToHorizontal(ra, 0, 40, 0, date)
      if (position.altDeg > highest.altDeg) highest = position
    }
    expect(highest.altDeg).toBeCloseTo(50, 3)
    expect(highest.azDeg).toBeCloseTo(180, 1)
  })

  test('matches a known position for Sirius', () => {
    // Sirius (RA 101.287°, Dec -16.716°) from Greenwich at 2000-01-01 00:00 UTC.
    // GMST is ~99.97°, so Sirius is ~1.3° east of the meridian, just short of
    // its culmination altitude of 90° - 51.48° - 16.72° ≈ 21.8°.
    const { altDeg, azDeg } = equatorialToHorizontal(101.287, -16.716, 51.4769, 0, new Date('2000-01-01T00:00:00Z'))
    expect(altDeg).toBeCloseTo(21.8, 0)
    expect(azDeg).toBeGreaterThan(175)
    expect(azDeg).toBeLessThan(180)
  })
})
