type RGB = [number, number, number]

interface GradientStop {
  tempC: number
  top: RGB
  bottom: RGB
}

// Ordered cold -> hot. `top` stays dark across the whole range so stars keep
// contrast; only `bottom` (the horizon band) shifts hue with temperature.
const STOPS: GradientStop[] = [
  { tempC: -10, top: [4, 6, 14], bottom: [16, 36, 72] }, // icy blue
  { tempC: 0, top: [5, 7, 15], bottom: [24, 46, 86] },
  { tempC: 10, top: [6, 8, 16], bottom: [45, 50, 92] }, // blue-violet
  { tempC: 20, top: [7, 8, 17], bottom: [92, 62, 98] }, // violet twilight
  { tempC: 30, top: [9, 8, 16], bottom: [150, 72, 70] }, // amber-rose
  { tempC: 35, top: [10, 8, 15], bottom: [186, 88, 58] }, // warm sunset
]

const DEFAULT_TEMP_C = 15

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function toRgbString([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

export interface SkyGradient {
  top: string
  bottom: string
}

export function skyGradientForTemp(tempC: number | null): SkyGradient {
  const t = tempC ?? DEFAULT_TEMP_C
  const clamped = Math.min(STOPS[STOPS.length - 1].tempC, Math.max(STOPS[0].tempC, t))

  let lower = STOPS[0]
  let upper = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i].tempC && clamped <= STOPS[i + 1].tempC) {
      lower = STOPS[i]
      upper = STOPS[i + 1]
      break
    }
  }

  const span = upper.tempC - lower.tempC
  const ratio = span === 0 ? 0 : (clamped - lower.tempC) / span

  return {
    top: toRgbString(lerpRgb(lower.top, upper.top, ratio)),
    bottom: toRgbString(lerpRgb(lower.bottom, upper.bottom, ratio)),
  }
}
