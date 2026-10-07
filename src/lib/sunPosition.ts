import { type AltAz, equatorialToHorizontal, toJulianDate } from './skyPosition'

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI
const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

// The sun's center sits this far below the horizon at sunrise and sunset:
// refraction (34′) plus its own radius (16′).
const RISE_SET_ALT_DEG = -0.833

const COARSE_STEP_MS = 10 * MINUTE_MS
const PATH_STEP_MS = 5 * MINUTE_MS

/**
 * The sun's right ascension and declination (degrees) at a moment, from the
 * Astronomical Almanac's low-precision formulae (good to about 0.01°).
 */
function sunEquatorial(date: Date): { raDeg: number; decDeg: number } {
  const n = toJulianDate(date) - 2451545.0
  const meanLongitude = 280.46 + 0.9856474 * n
  const meanAnomaly = (357.528 + 0.9856003 * n) * DEG_TO_RAD
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG_TO_RAD
  const obliquity = (23.439 - 0.0000004 * n) * DEG_TO_RAD

  return {
    raDeg: Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude)) * RAD_TO_DEG,
    decDeg: Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) * RAD_TO_DEG,
  }
}

/** Where the sun is in the sky, for an observer at the given latitude/longitude and moment. */
export function sunPosition(date: Date, latDeg: number, lonDeg: number): AltAz {
  const { raDeg, decDeg } = sunEquatorial(date)
  return equatorialToHorizontal(raDeg, decDeg, latDeg, lonDeg, date)
}

interface SunSample extends AltAz {
  time: Date
}

export interface SunDay {
  /** Solar noon: the sun at its highest. */
  transit: SunSample
  /** Null when the sun doesn't rise that day (polar night) or doesn't set (midnight sun). */
  rise: Date | null
  set: Date | null
  /** The sun's track across the sky from rise to set, or around the whole day under a midnight sun. */
  path: SunSample[]
}

function sample(timeMs: number, latDeg: number, lonDeg: number): SunSample {
  const time = new Date(timeMs)
  return { time, ...sunPosition(time, latDeg, lonDeg) }
}

/** Narrows a horizon crossing between two times down to the minute. */
function findCrossing(startMs: number, endMs: number, latDeg: number, lonDeg: number): Date {
  const aboveAtStart = sunPosition(new Date(startMs), latDeg, lonDeg).altDeg > RISE_SET_ALT_DEG
  let lo = startMs
  let hi = endMs
  while (hi - lo > MINUTE_MS / 2) {
    const mid = (lo + hi) / 2
    const above = sunPosition(new Date(mid), latDeg, lonDeg).altDeg > RISE_SET_ALT_DEG
    if (above === aboveAtStart) lo = mid
    else hi = mid
  }
  return new Date(Math.round((lo + hi) / 2))
}

/** The first time in [startMs, endMs] the sun crosses the rise/set altitude, if it does. */
function firstCrossing(startMs: number, endMs: number, latDeg: number, lonDeg: number): Date | null {
  let prevMs = startMs
  let prevAbove = sunPosition(new Date(startMs), latDeg, lonDeg).altDeg > RISE_SET_ALT_DEG
  for (let t = startMs + COARSE_STEP_MS; t <= endMs; t += COARSE_STEP_MS) {
    const above = sunPosition(new Date(t), latDeg, lonDeg).altDeg > RISE_SET_ALT_DEG
    if (above !== prevAbove) return findCrossing(prevMs, t, latDeg, lonDeg)
    prevMs = t
    prevAbove = above
  }
  return null
}

/**
 * The sun's day around a moment: the solar noon nearest to it, the sunrise
 * before that noon, the sunset after it, and the track in between.
 */
export function sunDay(date: Date, latDeg: number, lonDeg: number): SunDay {
  // Exactly one solar noon falls within 12 hours either side of any moment,
  // so find the highest coarse sample, then narrow in on the peak around it.
  const nowMs = date.getTime()
  let peakMs = nowMs - 12 * HOUR_MS
  let peakAlt = Number.NEGATIVE_INFINITY
  for (let t = peakMs; t <= nowMs + 12 * HOUR_MS; t += COARSE_STEP_MS) {
    const { altDeg } = sunPosition(new Date(t), latDeg, lonDeg)
    if (altDeg > peakAlt) {
      peakAlt = altDeg
      peakMs = t
    }
  }
  let lo = peakMs - COARSE_STEP_MS
  let hi = peakMs + COARSE_STEP_MS
  while (hi - lo > MINUTE_MS / 2) {
    const a = lo + (hi - lo) / 3
    const b = hi - (hi - lo) / 3
    if (sunPosition(new Date(a), latDeg, lonDeg).altDeg < sunPosition(new Date(b), latDeg, lonDeg).altDeg) lo = a
    else hi = b
  }
  const transit = sample(Math.round((lo + hi) / 2), latDeg, lonDeg)
  const transitMs = transit.time.getTime()

  const rise =
    transit.altDeg > RISE_SET_ALT_DEG ? firstCrossing(transitMs - 12 * HOUR_MS, transitMs, latDeg, lonDeg) : null
  const set =
    transit.altDeg > RISE_SET_ALT_DEG ? firstCrossing(transitMs, transitMs + 12 * HOUR_MS, latDeg, lonDeg) : null

  const path: SunSample[] = []
  if (transit.altDeg > RISE_SET_ALT_DEG) {
    // Under a midnight sun there's no rise or set, so the track circles the
    // whole sky from one midnight to the next.
    const startMs = rise?.getTime() ?? transitMs - 12 * HOUR_MS
    const endMs = set?.getTime() ?? transitMs + 12 * HOUR_MS
    for (let t = startMs; t < endMs; t += PATH_STEP_MS) path.push(sample(t, latDeg, lonDeg))
    path.push(sample(endMs, latDeg, lonDeg))
  }

  return { transit, rise, set, path }
}
