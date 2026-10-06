import { useEffect, useState } from 'react'

// 'unanswered': the visitor hasn't answered the permission prompt in time.
// It can still turn into 'located' or 'fallback' if they answer later.
export type VisitorLocationStatus = 'loading' | 'located' | 'fallback' | 'unanswered'

export interface VisitorLocation {
  lat: number
  lon: number
  status: VisitorLocationStatus
}

// Used when geolocation is denied, unavailable, or times out.
const FALLBACK_LOCATION = { lat: 40.7128, lon: -74.006 }
const GEOLOCATION_TIMEOUT_MS = 5000
// Browsers only start the timeout above once permission is granted, so a
// prompt the visitor ignores would leave this loading forever.
export const PROMPT_TIMEOUT_MS = 5000

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

    const promptTimer = setTimeout(() => {
      setLocation((prev) => (prev.status === 'loading' ? { ...prev, status: 'unanswered' } : prev))
    }, PROMPT_TIMEOUT_MS)

    return () => {
      cancelled = true
      clearTimeout(promptTimer)
    }
  }, [])

  return location
}
