import { afterEach, describe, expect, test } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { stubGeolocation } from '../test/stubs'
import { useVisitorLocation } from './useVisitorLocation'

const NEW_YORK = { lat: 40.7128, lon: -74.006 }

let restore = () => {}
afterEach(() => restore())

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
})
