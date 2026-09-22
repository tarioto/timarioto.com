import './WeatherSection.css'
import { useVisitorWeather } from '../hooks/useVisitorWeather'

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

export default function WeatherSection() {
  const { current, forecast, locationName, status } = useVisitorWeather()

  if (status === 'loading' || !current) return null

  return (
    <section className="weather-section" aria-label="Weather">
      <h2 className="weather-section-title">Weather</h2>
      <div className="weather-section-current">
        <span className="weather-section-current-icon" role="img" aria-hidden="true">
          {current.icon}
        </span>
        <div>
          <span className="weather-section-temp">{Math.round(current.tempC)}°C</span>
          <p className="weather-section-description">
            {current.description}
            {locationName ? ` in ${locationName}` : ' near you'}
          </p>
        </div>
      </div>
      <div className="weather-section-forecast">
        {forecast.map((day) => (
          <div className="weather-section-forecast-card" key={day.date}>
            <span className="weather-section-forecast-day">{dayLabel(day.date)}</span>
            <span className="weather-section-forecast-icon" role="img" aria-hidden="true">
              {day.icon}
            </span>
            <span className="weather-section-forecast-temps">
              <span className="weather-section-forecast-high">{Math.round(day.tempMaxC)}°</span> {Math.round(day.tempMinC)}°
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
