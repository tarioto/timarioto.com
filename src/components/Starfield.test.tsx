import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { render } from '@testing-library/react'
import { fetchesSettled, openMeteoResponse, stubFetch, stubGeolocation } from '../test/stubs'
import Starfield from './Starfield'

// A 2D context that records every method called on it, and every fill style.
function recordingContext() {
  const calls: string[] = []
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop) => () => calls.push(String(prop)),
      set: (_target, prop, value) => {
        if (prop === 'fillStyle') calls.push(`fillStyle=${value}`)
        return true
      },
    },
  )
  return { ctx: ctx as CanvasRenderingContext2D, calls }
}

// happy-dom doesn't lay anything out, so give every element a fixed size.
function stubLayout(width: number, height: number) {
  const proto = HTMLElement.prototype
  const original = {
    clientWidth: Object.getOwnPropertyDescriptor(proto, 'clientWidth')!,
    clientHeight: Object.getOwnPropertyDescriptor(proto, 'clientHeight')!,
  }
  Object.defineProperty(proto, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(proto, 'clientHeight', { configurable: true, get: () => height })
  spyOn(proto, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width, height } as DOMRect)
  return () => {
    Object.defineProperty(proto, 'clientWidth', original.clientWidth)
    Object.defineProperty(proto, 'clientHeight', original.clientHeight)
  }
}

let restoreGeolocation = () => {}
let restoreLayout = () => {}
let frames: FrameRequestCallback[] = []
let calls: string[] = []

function runFrame(timeMs = 1000) {
  const pending = frames
  frames = []
  for (const frame of pending) frame(timeMs)
}

beforeEach(() => {
  frames = []
  const recording = recordingContext()
  calls = recording.calls
  spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(recording.ctx as never)
  spyOn(window, 'requestAnimationFrame').mockImplementation((frame) => frames.push(frame))
  spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  restoreGeolocation = stubGeolocation('pending')
  restoreLayout = stubLayout(1200, 800)
})

afterEach(() => {
  restoreGeolocation()
  restoreLayout()
})

const hoverTinted = () => calls.filter((call) => call.startsWith('fillStyle=hsla'))

describe('Starfield', () => {
  test('draws stars and constellation lines every frame', () => {
    render(<Starfield />)
    runFrame()
    const stars = calls.filter((call) => call === 'arc').length
    expect(stars).toBeGreaterThan(100)
    expect(calls).toContain('stroke')

    calls.length = 0
    runFrame(2000)
    expect(calls.filter((call) => call === 'arc')).toHaveLength(stars)
  })

  test('draws a single still frame when the visitor prefers reduced motion', () => {
    spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    render(<Starfield />)
    expect(calls).toContain('arc')
    expect(frames).toHaveLength(0)
  })

  test('stops animating and listening on unmount', () => {
    const cancel = spyOn(window, 'cancelAnimationFrame')
    const removeListener = spyOn(window, 'removeEventListener')
    const { unmount } = render(<Starfield />)
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(removeListener).toHaveBeenCalledWith('pointermove', expect.any(Function))
  })

  test('tints stars near a mouse pointer until it leaves the page', () => {
    render(<Starfield />)
    runFrame()
    expect(hoverTinted()).toEqual([])

    // The glow eases in, so give it a few frames to reach the stars.
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 600, clientY: 400 }))
    for (let i = 0; i < 30; i++) runFrame()
    expect(hoverTinted().length).toBeGreaterThan(0)

    document.documentElement.dispatchEvent(new PointerEvent('pointerleave'))
    for (let i = 0; i < 60; i++) runFrame()
    calls.length = 0
    runFrame()
    expect(hoverTinted()).toEqual([])
  })

  test('ignores touch pointers', () => {
    render(<Starfield />)
    window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 600, clientY: 400 }))
    for (let i = 0; i < 30; i++) runFrame()
    expect(hoverTinted()).toEqual([])
  })

  test('tints the sky by the local temperature', async () => {
    restoreGeolocation()
    restoreGeolocation = stubGeolocation({ lat: 51.5, lon: -0.12 })
    const fetchSpy = stubFetch({ 'api.open-meteo.com': openMeteoResponse, 'api.bigdatacloud.net': {} })
    const { container } = render(<Starfield />)
    await fetchesSettled(fetchSpy)
    // 20.4°C lands just past the violet twilight stop.
    const gradient = container.querySelector<HTMLElement>('.starfield-gradient')!
    expect(gradient.style.background).toContain('rgb(94, 62, 97)')
  })
})
