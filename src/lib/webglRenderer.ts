import { WebGLRenderer } from 'three'

/** A WebGL renderer drawing to `canvas`, or null where the browser can't provide WebGL. */
export function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer | null {
  try {
    return new WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
}
