import { useEffect, useState } from 'react'

export type VisitorSkyStatus = 'loading' | 'located' | 'fallback'

export interface VisitorSky {
  lat: number
  lon: number
  tempC: number | null
  status: VisitorSkyStatus
}

// Used when geolocation is denied, unavailable, or times out, so the sky and
// gradient still render for a real place/time rather than nothing at all.
const FALLBACK_LOCATION = { lat: 40.7128, lon: -74.006 }
const GEOLOCATION_TIMEOUT_MS = 5000

async function fetchTemperature(lat: number, lon: number, signal: AbortSignal): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
    const response = await fetch(url, { signal })
    const data = await response.json()
    const tempC = data?.current?.temperature_2m
    return typeof tempC === 'number' ? tempC : null
  } catch {
    return null
  }
}

export function useVisitorSky(): VisitorSky {
  const [sky, setSky] = useState<VisitorSky>({
    lat: FALLBACK_LOCATION.lat,
    lon: FALLBACK_LOCATION.lon,
    tempC: null,
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function resolve(lat: number, lon: number, status: VisitorSkyStatus) {
      const tempC = await fetchTemperature(lat, lon, controller.signal)
      if (!cancelled) setSky({ lat, lon, tempC, status })
    }

    if (!('geolocation' in navigator)) {
      void resolve(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lon, 'fallback')
      return () => {
        cancelled = true
        controller.abort()
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) void resolve(position.coords.latitude, position.coords.longitude, 'located')
      },
      () => {
        if (!cancelled) void resolve(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lon, 'fallback')
      },
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 3600000 },
    )

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return sky
}
