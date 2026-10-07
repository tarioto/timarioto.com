import { describe, expect, test } from 'bun:test'
import { Line, Mesh, Sprite } from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { createDaySkyScene, domePoint, verticalFovForAspect } from './daySkyScene'
import { sunDay, sunPosition } from './sunPosition'

const NEW_YORK = { lat: 40.7128, lon: -74.006 }

function sceneAt(iso: string, width = 1200, height = 800) {
  const time = new Date(iso)
  const day = sunDay(time, NEW_YORK.lat, NEW_YORK.lon)
  const now = { time, ...sunPosition(time, NEW_YORK.lat, NEW_YORK.lon) }
  const sky = createDaySkyScene()
  sky.setSize(width, height)
  sky.setSun(day, now)
  return { sky, day, now }
}

// The path behind the sun, the path ahead of it, and the guide down from it.
function fatLines(sky: ReturnType<typeof createDaySkyScene>) {
  return sky.scene.children.filter((child) => child instanceof Line2)
}

describe('domePoint', () => {
  test('puts the front azimuth straight ahead, down -z', () => {
    const point = domePoint(0, 180, 180, 100)
    expect(point.x).toBeCloseTo(0)
    expect(point.y).toBeCloseTo(0)
    expect(point.z).toBeCloseTo(-100)
  })

  test('puts east on the left when facing south, and on the right when facing north', () => {
    expect(domePoint(0, 90, 180, 100).x).toBeCloseTo(-100)
    expect(domePoint(0, 90, 0, 100).x).toBeCloseTo(100)
  })

  test('puts the zenith straight up', () => {
    const point = domePoint(90, 123, 180, 100)
    expect(point.x).toBeCloseTo(0)
    expect(point.y).toBeCloseTo(100)
    expect(point.z).toBeCloseTo(0)
  })
})

describe('verticalFovForAspect', () => {
  test('widens the vertical view as the screen gets narrower, within limits', () => {
    expect(verticalFovForAspect(16 / 9)).toBeLessThan(verticalFovForAspect(4 / 3))
    expect(verticalFovForAspect(10)).toBe(40)
    expect(verticalFovForAspect(0.2)).toBe(100)
  })
})

describe('createDaySkyScene', () => {
  test('places the sun on the dome at its current height', () => {
    const { sky, day, now } = sceneAt('2026-06-21T19:00:00Z')
    const expected = domePoint(now.altDeg, now.azDeg, day.transit.azDeg)
    const sun = sky.scene.children.find((child) => child instanceof Mesh && child.children[0] instanceof Sprite)!
    expect(sun.visible).toBe(true)
    expect(sun.position.distanceTo(expected)).toBeCloseTo(0)
  })

  test('draws the path behind and ahead of the sun, and a guide down from it', () => {
    const { sky } = sceneAt('2026-06-21T19:00:00Z')
    expect(fatLines(sky).map((line) => line.visible)).toEqual([true, true, true])
  })

  test('hides the sun and its guide while it is just below the horizon', () => {
    // 20 minutes after sunset, still in civil twilight.
    const { sky, day } = sceneAt('2026-06-22T00:51:00Z')
    expect(day.set!.getTime()).toBeLessThan(new Date('2026-06-22T00:51:00Z').getTime())
    const [past, future, guide] = fatLines(sky)
    expect(past.visible).toBe(true)
    expect(future.visible).toBe(false)
    expect(guide.visible).toBe(false)
    expect(sky.labelPositions(1200, 800).sun.visible).toBe(false)
  })

  test('projects labels onto the screen, sunrise left of sunset when facing south', () => {
    const { sky } = sceneAt('2026-06-21T19:00:00Z')
    const labels = sky.labelPositions(1200, 800)
    expect(labels.rise.visible && labels.set.visible && labels.noon.visible && labels.sun.visible).toBe(true)
    expect(labels.rise.x).toBeLessThan(labels.noon.x)
    expect(labels.set.x).toBeGreaterThan(labels.noon.x)
    // Afternoon: the sun has passed its peak, toward the west.
    expect(labels.sun.x).toBeGreaterThan(labels.noon.x)
    // The peak is above the horizon straight ahead.
    expect(labels.noon.y).toBeLessThan(labels.south.y)
  })

  test('drifts the camera for parallax', () => {
    const { sky } = sceneAt('2026-06-21T19:00:00Z')
    const before = sky.labelPositions(1200, 800).noon
    sky.setLook(1, 0)
    const after = sky.labelPositions(1200, 800).noon
    expect(after.x).not.toBeCloseTo(before.x)
  })

  test('fits the camera to the canvas', () => {
    const { sky } = sceneAt('2026-06-21T19:00:00Z', 400, 800)
    expect(sky.camera.aspect).toBe(0.5)
    expect(sky.camera.fov).toBe(verticalFovForAspect(0.5))
  })

  test('frees its GPU resources', () => {
    const { sky } = sceneAt('2026-06-21T19:00:00Z')
    let disposed = 0
    sky.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof Line)
        object.geometry.addEventListener('dispose', () => disposed++)
    })
    sky.dispose()
    expect(disposed).toBeGreaterThan(5)
  })
})
