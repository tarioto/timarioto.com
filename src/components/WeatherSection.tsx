import styles from './WeatherSection.module.css'
import { useVisitorWeather } from '../hooks/useVisitorWeather'

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

export default function WeatherSection() {
  const { current, forecast, locationName, status } = useVisitorWeather()

  if (status === 'loading' || !current) return null

  return (
    <section className={styles.section} aria-label="Weather">
      <h2 className={styles.title}>Weather</h2>
      <div className={styles.current}>
        <span className={styles.currentIcon} role="img" aria-hidden="true">
          {current.icon}
        </span>
        <div>
          <span className={styles.temp}>{Math.round(current.tempC)}°C</span>
          <p className={styles.description}>
            {current.description}
            {locationName ? ` in ${locationName}` : ' near you'}
          </p>
        </div>
      </div>
      <div className={styles.forecast}>
        {forecast.map((day) => (
          <div className={styles.forecastCard} key={day.date}>
            <span className={styles.forecastDay}>{dayLabel(day.date)}</span>
            <span className={styles.forecastIcon} role="img" aria-hidden="true">
              {day.icon}
            </span>
            <span className={styles.forecastTemps}>
              <span className={styles.forecastHigh}>{Math.round(day.tempMaxC)}°</span> {Math.round(day.tempMinC)}°
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
