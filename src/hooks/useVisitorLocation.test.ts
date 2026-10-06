import { afterEach, describe, expect, jest, test } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import { answerGeolocation, stubGeolocation } from '../test/stubs'
import { PROMPT_TIMEOUT_MS, useVisitorLocation } from './useVisitorLocation'

const NEW_YORK = { lat: 40.7128, lon: -74.006 }

let restore = () => {}
afterEach(() => {
  restore()
  jest.useRealTimers()
})

describe('useVisitorLocation', () => {
  test("uses the visitor's position when they allow it", () => {
    restore = stubGeolocation({ lat: 51.5, lon: -0.12 })
    const { result } = renderHook(() => useVisitorLocation())
    expect(result.current).toEqual({ lat: 51.5, lon: -0.12, status: 'located' })
  })

  test('is loading while waiting for the browser', () => {
    restore = stubGeolocation('pending')
    const { result } = renderHook(() => useVisitorLocation())
    expect(result.current).toEqual({ ...NEW_YORK, status: 'loading' })
  })

  test('falls back to New York when permission is denied', () => {
    restore = stubGeolocation('denied')
    const { result } = renderHook(() => useVisitorLocation())
    expect(result.current).toEqual({ ...NEW_YORK, status: 'fallback' })
  })

  test('falls back to New York without the Geolocation API', () => {
    restore = stubGeolocation('unsupported')
    const { result } = renderHook(() => useVisitorLocation())
    expect(result.current).toEqual({ ...NEW_YORK, status: 'fallback' })
  })

  test('gives up waiting when the visitor leaves the prompt unanswered', () => {
    jest.useFakeTimers()
    restore = stubGeolocation('pending')
    const { result } = renderHook(() => useVisitorLocation())
    act(() => jest.advanceTimersByTime(PROMPT_TIMEOUT_MS - 1))
    expect(result.current.status).toBe('loading')
    act(() => jest.advanceTimersByTime(1))
    expect(result.current).toEqual({ ...NEW_YORK, status: 'unanswered' })
  })

  test('still uses an answer that arrives after giving up', () => {
    jest.useFakeTimers()
    restore = stubGeolocation('pending')
    const { result } = renderHook(() => useVisitorLocation())
    act(() => jest.advanceTimersByTime(PROMPT_TIMEOUT_MS))
    answerGeolocation({ lat: 51.5, lon: -0.12 })
    expect(result.current).toEqual({ lat: 51.5, lon: -0.12, status: 'located' })
  })

  test('keeps an answer that arrives before the prompt times out', () => {
    jest.useFakeTimers()
    restore = stubGeolocation('pending')
    const { result } = renderHook(() => useVisitorLocation())
    answerGeolocation('denied')
    act(() => jest.advanceTimersByTime(PROMPT_TIMEOUT_MS))
    expect(result.current).toEqual({ ...NEW_YORK, status: 'fallback' })
  })
})
