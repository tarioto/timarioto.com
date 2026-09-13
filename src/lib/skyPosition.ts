const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

function normalizeDegrees(deg: number): number {
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/** Greenwich Mean Sidereal Time, in degrees. */
function gmstDegrees(julianDate: number): number {
  const daysSinceJ2000 = julianDate - 2451545.0
  return normalizeDegrees(280.46061837 + 360.98564736629 * daysSinceJ2000)
}

/** Local Sidereal Time, in degrees, for a given east-positive longitude. */
function lstDegrees(date: Date, longitudeDeg: number): number {
  return normalizeDegrees(gmstDegrees(toJulianDate(date)) + longitudeDeg)
}

export interface AltAz {
  altDeg: number
  azDeg: number
}

/**
 * Converts equatorial coordinates (RA/Dec, degrees) to horizontal coordinates
 * (altitude/azimuth, degrees) for an observer at the given latitude/longitude
 * and moment in time. Azimuth is measured from north, clockwise through east.
 */
export function equatorialToHorizontal(
  raDeg: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date,
): AltAz {
  const hourAngleDeg = normalizeDegrees(lstDegrees(date, lonDeg) - raDeg)

  const h = hourAngleDeg * DEG_TO_RAD
  const dec = decDeg * DEG_TO_RAD
  const lat = latDeg * DEG_TO_RAD

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(h)
  const alt = Math.asin(Math.min(1, Math.max(-1, sinAlt)))

  const azFromSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat))
  const azFromNorth = normalizeDegrees(azFromSouth * RAD_TO_DEG + 180)

  return { altDeg: alt * RAD_TO_DEG, azDeg: azFromNorth }
}

export interface DomePoint {
  x: number
  y: number
  visible: boolean
}

/**
 * Projects an altitude/azimuth position onto a zenith-centered dome: the
 * center of the (radius-1) circle is straight up, the edge is the horizon.
 */
export function projectToDome(altDeg: number, azDeg: number, radius: number): DomePoint {
  const zenithAngle = (90 - altDeg) / 90
  const az = azDeg * DEG_TO_RAD
  return {
    x: radius * zenithAngle * Math.sin(az),
    y: -radius * zenithAngle * Math.cos(az),
    visible: altDeg > 0,
  }
}
