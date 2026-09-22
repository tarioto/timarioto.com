import { useEffect, useState } from 'react'

export type VisitorLocationStatus = 'loading' | 'located' | 'fallback'

export interface VisitorLocation {
  lat: number
  lon: number
  status: VisitorLocationStatus
}

// Used when geolocation is denied, unavailable, or times out.
const FALLBACK_LOCATION = { lat: 40.7128, lon: -74.006 }
const GEOLOCATION_TIMEOUT_MS = 5000

/** Resolves the visitor's coordinates via the browser Geolocation API, falling back to a fixed reference location. */
export function useVisitorLocation(): VisitorLocation {
  const [location, setLocation] = useState<VisitorLocation>(() =>
    'geolocation' in navigator
      ? { ...FALLBACK_LOCATION, status: 'loading' }
      : { ...FALLBACK_LOCATION, status: 'fallback' },
  )

  useEffect(() => {
    if (!('geolocation' in navigator)) return

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) {
          setLocation({ lat: position.coords.latitude, lon: position.coords.longitude, status: 'located' })
        }
      },
      () => {
        if (!cancelled) setLocation({ ...FALLBACK_LOCATION, status: 'fallback' })
      },
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 3_600_000 },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return location
}
