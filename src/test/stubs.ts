import { type Mock, spyOn } from 'bun:test'
import { act } from '@testing-library/react'

// Answers fetch calls whose URL contains a route key with that route's
// Response, or its value as a JSON body; any other URL rejects, as a network
// error would.
export function stubFetch(routes: Record<string, unknown>) {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input)
    const route = Object.keys(routes).find((key) => url.includes(key))
    if (route === undefined) throw new TypeError(`Unexpected fetch: ${url}`)
    const body = routes[route]
    return body instanceof Response ? body : new Response(JSON.stringify(body))
  }) as typeof fetch)
}

// Waits, inside act(), for every request made so far to finish and for the
// state updates that follow it.
export async function fetchesSettled(fetchSpy: Mock<typeof fetch>) {
  await act(async () => {
    await Promise.allSettled(fetchSpy.mock.results.map((result) => result.value))
  })
}

type PositionResult = { lat: number; lon: number } | 'denied' | 'pending'

// The callbacks of the latest request left 'pending', for answerGeolocation.
let pendingRequest: { success: PositionCallback; error: PositionErrorCallback } | null = null

// Answers the latest 'pending' location request, as a visitor finally
// responding to the permission prompt would.
export function answerGeolocation(result: Exclude<PositionResult, 'pending'>) {
  const request = pendingRequest!
  pendingRequest = null
  act(() => {
    if (result === 'denied') request.error({ code: 1, message: 'denied' } as GeolocationPositionError)
    else request.success({ coords: { latitude: result.lat, longitude: result.lon } } as GeolocationPosition)
  })
}

// Replaces navigator.geolocation for one test; returns a restore function.
export function stubGeolocation(result: PositionResult | 'unsupported') {
  const owner = Object.getPrototypeOf(navigator)
  const original = Object.getOwnPropertyDescriptor(owner, 'geolocation')!
  if (result === 'unsupported') {
    delete owner.geolocation
  } else {
    const geolocation = {
      getCurrentPosition(success: PositionCallback, error: PositionErrorCallback) {
        if (result === 'pending') {
          pendingRequest = { success, error }
          return
        }
        if (result === 'denied') error({ code: 1, message: 'denied' } as GeolocationPositionError)
        else success({ coords: { latitude: result.lat, longitude: result.lon } } as GeolocationPosition)
      },
    }
    Object.defineProperty(owner, 'geolocation', { configurable: true, get: () => geolocation })
  }
  return () => Object.defineProperty(owner, 'geolocation', original)
}

// An Open-Meteo response for a 20°C clear day with a 5-day forecast.
export const openMeteoResponse = {
  current: {
    temperature_2m: 20.4,
    apparent_temperature: 19,
    weather_code: 0,
    relative_humidity_2m: 50,
    wind_speed_10m: 10,
    is_day: 1,
  },
  daily: {
    time: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'],
    weather_code: [0, 3, 61, 71, 95, 45],
    temperature_2m_max: [22, 23.6, 24, 25, 26, 27],
    temperature_2m_min: [10, 11.4, 12, 13, 14, 15],
  },
}
