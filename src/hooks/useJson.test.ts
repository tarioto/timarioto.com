import { describe, expect, test } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { fetchesSettled, stubFetch } from '../test/stubs'
import { useJson } from './useJson'

describe('useJson', () => {
  test('returns the parsed body once it loads', async () => {
    const fetchSpy = stubFetch({ '/data.json': { hello: 'world' } })
    const { result } = renderHook(() => useJson<{ hello: string }>('/data.json'))
    expect(result.current).toEqual({ data: null, loading: true })
    await fetchesSettled(fetchSpy)
    expect(result.current).toEqual({ data: { hello: 'world' }, loading: false })
  })

  test('stops loading with no data when the request fails', async () => {
    const fetchSpy = stubFetch({})
    const { result } = renderHook(() => useJson('/data.json'))
    await fetchesSettled(fetchSpy)
    expect(result.current).toEqual({ data: null, loading: false })
  })

  test('stops loading with no data when the body is not JSON', async () => {
    const fetchSpy = stubFetch({ '/data.json': new Response('<!doctype html>') })
    const { result } = renderHook(() => useJson('/data.json'))
    await fetchesSettled(fetchSpy)
    expect(result.current).toEqual({ data: null, loading: false })
  })

  test('ignores a response that arrives after unmount', async () => {
    const fetchSpy = stubFetch({ '/data.json': { hello: 'world' } })
    const { result, unmount } = renderHook(() => useJson('/data.json'))
    unmount()
    await fetchesSettled(fetchSpy)
    expect(result.current).toEqual({ data: null, loading: true })
  })
})
