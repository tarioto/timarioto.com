import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import { useElementSize } from './useElementSize'

// A ResizeObserver whose resizes the test triggers by hand.
class FakeResizeObserver {
  static latest: FakeResizeObserver | null = null
  disconnected = false
  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.latest = this
  }
  observe() {}
  disconnect() {
    this.disconnected = true
  }
  resize(width: number, height: number) {
    act(() => this.callback([{ contentRect: { width, height } } as ResizeObserverEntry], this as never))
  }
}

const RealResizeObserver = globalThis.ResizeObserver
beforeEach(() => {
  globalThis.ResizeObserver = FakeResizeObserver as never
})
afterEach(() => {
  globalThis.ResizeObserver = RealResizeObserver
})

function renderWithElement() {
  const ref = { current: document.createElement('div') }
  return renderHook(() => useElementSize(ref))
}

describe('useElementSize', () => {
  test('starts at 0×0', () => {
    expect(renderWithElement().result.current).toEqual({ width: 0, height: 0 })
  })

  test('tracks the rounded size', () => {
    const { result } = renderWithElement()
    FakeResizeObserver.latest!.resize(320.4, 199.6)
    expect(result.current).toEqual({ width: 320, height: 200 })
  })

  test('keeps the same object when the rounded size is unchanged', () => {
    const { result } = renderWithElement()
    FakeResizeObserver.latest!.resize(320, 200)
    const first = result.current
    FakeResizeObserver.latest!.resize(320.2, 199.8)
    expect(result.current).toBe(first)
  })

  test('stops observing on unmount', () => {
    const { unmount } = renderWithElement()
    unmount()
    expect(FakeResizeObserver.latest!.disconnected).toBe(true)
  })

  test('does nothing without an element', () => {
    FakeResizeObserver.latest = null
    const { result } = renderHook(() => useElementSize({ current: null }))
    expect(FakeResizeObserver.latest).toBeNull()
    expect(result.current).toEqual({ width: 0, height: 0 })
  })
})
