import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { render } from '@testing-library/react'
import type { WebGLRenderer } from 'three'
import * as webglRenderer from '../lib/webglRenderer'
import DaySky from './DaySky'

const NEW_YORK = { lat: 40.7128, lon: -74.006 }
const AFTERNOON = new Date('2026-06-21T19:00:00Z')

// happy-dom doesn't lay anything out, so give every element a fixed size.
function stubLayout(width: number, height: number) {
  const proto = HTMLElement.prototype
  const original = {
    clientWidth: Object.getOwnPropertyDescriptor(proto, 'clientWidth')!,
    clientHeight: Object.getOwnPropertyDescriptor(proto, 'clientHeight')!,
  }
  Object.defineProperty(proto, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(proto, 'clientHeight', { configurable: true, get: () => height })
  return () => {
    Object.defineProperty(proto, 'clientWidth', original.clientWidth)
    Object.defineProperty(proto, 'clientHeight', original.clientHeight)
  }
}

function fakeRenderer() {
  return {
    renders: 0,
    disposed: false,
    setPixelRatio() {},
    setSize() {},
    render() {
      this.renders++
    },
    dispose() {
      this.disposed = true
    },
  }
}

let renderer: ReturnType<typeof fakeRenderer>
let frames: FrameRequestCallback[] = []
let restoreLayout = () => {}

function runFrames(count: number) {
  for (let i = 0; i < count; i++) {
    const pending = frames
    frames = []
    for (const frame of pending) frame(i * 16)
  }
}

const labelX = (el: HTMLElement) => Number(el.style.transform.match(/translate\(([\d.-]+)px/)![1])

const label = (container: HTMLElement, text: string) =>
  [...container.querySelectorAll<HTMLElement>('.day-sky-label')].find((el) => el.textContent?.startsWith(text))!

beforeEach(() => {
  frames = []
  renderer = fakeRenderer()
  spyOn(webglRenderer, 'createRenderer').mockReturnValue(renderer as unknown as WebGLRenderer)
  spyOn(window, 'requestAnimationFrame').mockImplementation((frame) => frames.push(frame))
  spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  restoreLayout = stubLayout(1200, 800)
})

afterEach(() => restoreLayout())

describe('DaySky', () => {
  test("labels the day's sunrise, sunset, peak, and the sun's current height", () => {
    const { container } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    const texts = [...container.querySelectorAll('.day-sky-label')].map((el) => el.textContent)
    expect(texts).toEqual([
      expect.stringMatching(/^Sunrise \d+:\d\d [AP]M$/),
      expect.stringMatching(/^Sunset \d+:\d\d [AP]M$/),
      expect.stringMatching(/^Peak 73° · \d+:\d\d [AP]M$/),
      '59° now',
      'E',
      'S',
      'W',
      'N',
    ])
  })

  test('pins each label to its point in the scene every frame', () => {
    const { container } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    runFrames(1)
    const sun = label(container, 'Peak')
    expect(sun.hidden).toBe(false)
    expect(sun.style.transform).toMatch(/^translate\([\d.]+px, [\d.]+px\)$/)
    expect(renderer.renders).toBe(1)
  })

  test('keeps sunrise and sunset labels on screen', () => {
    restoreLayout()
    restoreLayout = stubLayout(200, 800)
    const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 80 })
    const { container } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    runFrames(1)
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth)
    // Half the label's width plus the edge margin, in from each side.
    expect(labelX(label(container, 'Sunrise'))).toBe(52)
    expect(labelX(label(container, 'Sunset'))).toBe(148)
  })

  test('drifts the view with a mouse pointer, and back when it leaves the page', () => {
    const { container } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    runFrames(1)
    const peak = label(container, 'Peak')
    const centered = labelX(peak)

    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 0, clientY: 0 }))
    runFrames(30)
    expect(labelX(peak)).not.toBeCloseTo(centered)

    // The view eases back, so give it time to settle.
    document.documentElement.dispatchEvent(new PointerEvent('pointerleave'))
    runFrames(300)
    expect(labelX(peak)).toBeCloseTo(centered)
  })

  test('ignores touch pointers', () => {
    const { container } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    runFrames(1)
    const peak = label(container, 'Peak')
    const centered = peak.style.transform
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 0, clientY: 0 }))
    runFrames(30)
    expect(peak.style.transform).toBe(centered)
  })

  test('draws a still frame, and again as the sun moves, when the visitor prefers reduced motion', () => {
    spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    const { container, rerender } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    expect(frames).toHaveLength(0)
    const before = renderer.renders
    expect(before).toBeGreaterThan(0)
    const sunBefore = label(container, 'Peak').style.transform

    rerender(<DaySky {...NEW_YORK} now={new Date('2026-06-21T20:00:00Z')} />)
    expect(renderer.renders).toBeGreaterThan(before)
    expect(label(container, 'Peak').style.transform).toBe(sunBefore)
  })

  test('falls back to a CSS sky without WebGL', () => {
    spyOn(webglRenderer, 'createRenderer').mockReturnValue(null)
    const { container } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    const sky = container.querySelector<HTMLElement>('.day-sky')!
    expect(sky.style.background).toContain('linear-gradient')
    expect(sky.hasAttribute('data-webgl')).toBe(false)
    expect(frames).toHaveLength(0)
  })

  test('stops drawing and frees the renderer on unmount', () => {
    const cancel = spyOn(window, 'cancelAnimationFrame')
    const removeListener = spyOn(window, 'removeEventListener')
    const { unmount } = render(<DaySky {...NEW_YORK} now={AFTERNOON} />)
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(removeListener).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(renderer.disposed).toBe(true)
  })
})
