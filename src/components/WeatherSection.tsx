import { useEffect, useState } from 'react'
import styles from './WeatherSection.module.css'

interface CurrentConditions {
  tempC: number
  feelsLikeC: number
  description: string
  icon: string | null
  humidity: number
  windKph: number
}

interface ForecastDay {
  date: string
  tempMinC: number
  tempMaxC: number
  description: string
  icon: string | null
}

interface WeatherData {
  updatedAt: string
  location: { name: string; country: string | null }
  current: CurrentConditions
  forecast: ForecastDay[]
}

function iconUrl(icon: string | null) {
  return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

export default function WeatherSection() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/weather.json')
      .then((res) => res.json())
      .then((data: WeatherData) => {
        if (!cancelled) setWeather(data)
      })
      .catch(() => {
        // No data yet (e.g. the poller hasn't run, or CloudFront served the
        // SPA fallback instead of a real weather.json) — render nothing.
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!weather) return null

  return (
    <section className={styles.section} aria-label="Weather">
      <h2 className={styles.title}>Weather</h2>
      <div className={styles.current}>
        {iconUrl(weather.current.icon) && (
          <img className={styles.currentIcon} src={iconUrl(weather.current.icon)!} alt="" width={80} height={80} />
        )}
        <div>
          <span className={styles.temp}>{weather.current.tempC}°C</span>
          <p className={styles.description}>
            {weather.current.description} in {weather.location.name}
          </p>
        </div>
      </div>
      <div className={styles.forecast}>
        {weather.forecast.map((day) => (
          <div className={styles.forecastCard} key={day.date}>
            <span className={styles.forecastDay}>{dayLabel(day.date)}</span>
            {iconUrl(day.icon) && <img className={styles.forecastIcon} src={iconUrl(day.icon)!} alt="" width={40} height={40} />}
            <span className={styles.forecastTemps}>
              <span className={styles.forecastHigh}>{day.tempMaxC}°</span> {day.tempMinC}°
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
