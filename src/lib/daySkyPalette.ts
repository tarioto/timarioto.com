import { lerpRgb, type RGB, toRgbString } from './skyGradient'

/** Below this sun altitude it's dark enough for the starfield. Civil twilight ends at -6°. */
export const DAY_MIN_SUN_ALT_DEG = -6

export interface DaySkyPalette {
  zenith: RGB
  horizon: RGB
  /** The halo around the sun. */
  glow: RGB
  ground: RGB
}

interface PaletteStop extends DaySkyPalette {
  altDeg: number
}

// Ordered by sun altitude, from the end of civil twilight to high noon. The
// zenith never gets lighter than a mid blue, so white text on the glass
// panels keeps its contrast at midday.
const STOPS: PaletteStop[] = [
  { altDeg: -6, zenith: [10, 14, 34], horizon: [64, 44, 78], glow: [214, 98, 64], ground: [8, 9, 14] },
  { altDeg: 0, zenith: [20, 34, 74], horizon: [178, 96, 72], glow: [255, 136, 68], ground: [20, 22, 28] },
  { altDeg: 8, zenith: [24, 58, 120], horizon: [140, 118, 132], glow: [255, 188, 118], ground: [36, 42, 44] },
  { altDeg: 25, zenith: [22, 70, 146], horizon: [82, 128, 178], glow: [255, 232, 196], ground: [46, 60, 56] },
  { altDeg: 60, zenith: [18, 72, 154], horizon: [74, 130, 186], glow: [255, 248, 232], ground: [50, 66, 60] },
]

export function daySkyPalette(sunAltDeg: number): DaySkyPalette {
  const last = STOPS[STOPS.length - 1]
  if (sunAltDeg <= STOPS[0].altDeg) return STOPS[0]
  if (sunAltDeg >= last.altDeg) return last

  const upperIndex = STOPS.findIndex((stop) => stop.altDeg > sunAltDeg)
  const lower = STOPS[upperIndex - 1]
  const upper = STOPS[upperIndex]
  const t = (sunAltDeg - lower.altDeg) / (upper.altDeg - lower.altDeg)
  return {
    zenith: lerpRgb(lower.zenith, upper.zenith, t),
    horizon: lerpRgb(lower.horizon, upper.horizon, t),
    glow: lerpRgb(lower.glow, upper.glow, t),
    ground: lerpRgb(lower.ground, upper.ground, t),
  }
}

/** A CSS stand-in for the 3D sky: shown while three.js loads, and where WebGL isn't available. */
export function daySkyCssGradient(sunAltDeg: number): string {
  const { zenith, horizon, ground } = daySkyPalette(sunAltDeg)
  return `linear-gradient(to bottom, ${toRgbString(zenith)}, ${toRgbString(horizon)} 70%, ${toRgbString(ground)} 70%)`
}
