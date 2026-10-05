import { useEffect, useState } from 'react'
import { describeWeatherCode } from '../lib/weatherCode'
import { useVisitorLocation, type VisitorLocationStatus } from './useVisitorLocation'

interface CurrentConditions {
  tempC: number
  feelsLikeC: number
  description: string
  icon: string
  humidity: number
  windKph: number
}

interface ForecastDay {
  date: string
  tempMinC: number
  tempMaxC: number
  description: string
  icon: string
}

export interface VisitorWeather {
  lat: number
  lon: number
  status: VisitorLocationStatus
  // True until the forecast request has settled, including while locating.
  loading: boolean
  locationName: string | null
  current: CurrentConditions | null
  forecast: ForecastDay[]
}

interface FetchedWeather {
  current: CurrentConditions | null
  forecast: ForecastDay[]
}

// The subset of Open-Meteo's /v1/forecast response this hook requests.
interface OpenMeteoResponse {
  current?: {
    temperature_2m: number
    apparent_temperature: number
    weather_code: number
    relative_humidity_2m: number
    wind_speed_10m: number
    is_day: number
  }
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

interface ReverseGeocodeResponse {
  city?: string
  locality?: string
  countryCode?: string
}

/** Maps an Open-Meteo forecast response onto current conditions and the next 5 days. */
export function parseWeather(data: OpenMeteoResponse | null): FetchedWeather {
  const current: CurrentConditions | null = data?.current
    ? {
        tempC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windKph: data.current.wind_speed_10m,
        ...describeWeatherCode(data.current.weather_code, data.current.is_day === 1),
      }
    : null

  const daily = data?.daily
  const dates: string[] = daily?.time ?? []
  // Skip today (index 0) so the strip shows the next 5 days, like a forecast.
  const forecast: ForecastDay[] = dates.slice(1, 6).map((date, i) => {
    const idx = i + 1
    return {
      date,
      tempMinC: daily!.temperature_2m_min[idx],
      tempMaxC: daily!.temperature_2m_max[idx],
      ...describeWeatherCode(daily!.weather_code[idx], true),
    }
  })

  return { current, forecast }
}

/** Formats a BigDataCloud reverse-geocode response as "City, CC". */
export function parseLocationName(data: ReverseGeocodeResponse | null): string | null {
  const name = data?.city || data?.locality
  if (!name) return null
  return data?.countryCode ? `${name}, ${data.countryCode}` : name
}

async function fetchWeather(lat: number, lon: number, signal: AbortSignal): Promise<FetchedWeather> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '6',
    })
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
    return parseWeather(await response.json())
  } catch {
    return { current: null, forecast: [] }
  }
}

async function fetchLocationName(lat: number, lon: number, signal: AbortSignal): Promise<string | null> {
  try {
    const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), localityLanguage: 'en' })
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, { signal })
    return parseLocationName(await response.json())
  } catch {
    return null
  }
}

/** Live weather for the visitor's own location (Open-Meteo), shared by the starfield and the Weather section. */
export function useVisitorWeather(): VisitorWeather {
  const location = useVisitorLocation()
  const [data, setData] = useState<FetchedWeather & { locationName: string | null; fetched: boolean }>({
    current: null,
    forecast: [],
    locationName: null,
    fetched: false,
  })

  useEffect(() => {
    if (location.status === 'loading') return
    let cancelled = false
    const controller = new AbortController()

    fetchWeather(location.lat, location.lon, controller.signal).then((weather) => {
      if (!cancelled) setData((prev) => ({ ...prev, ...weather, fetched: true }))
    })
    fetchLocationName(location.lat, location.lon, controller.signal).then((locationName) => {
      if (!cancelled) setData((prev) => ({ ...prev, locationName }))
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [location.lat, location.lon, location.status])

  const { fetched, ...weather } = data
  return { lat: location.lat, lon: location.lon, status: location.status, loading: !fetched, ...weather }
}
