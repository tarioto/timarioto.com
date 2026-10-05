import './WeatherSection.css'
import { useVisitorWeather } from '../hooks/useVisitorWeather'
import GlassBacking from './GlassBacking'
import PageSection from './PageSection'
import Skeleton from './Skeleton'

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

// The section's placeholder while the weather loads, built from the same
// classes so it takes up the same space.
function WeatherSkeleton() {
  return (
    <PageSection className="weather-section" title="Weather" aria-busy="true">
      <div className="weather-section-current">
        <span className="weather-section-current-icon">
          <Skeleton width="1em" />
        </span>
        <div>
          <span className="weather-section-temp">
            <Skeleton width="2.5em" />
          </span>
          <p className="weather-section-description">
            <Skeleton width="12em" />
          </p>
        </div>
      </div>
      <div className="weather-section-forecast">
        {['a', 'b', 'c', 'd', 'e'].map((key) => (
          <div className="weather-section-forecast-card" key={key}>
            <GlassBacking radius={12} />
            <span className="weather-section-forecast-day">
              <Skeleton width="2.5em" />
            </span>
            <span className="weather-section-forecast-icon">
              <Skeleton width="1em" />
            </span>
            <span className="weather-section-forecast-temps">
              <Skeleton width="3.5em" />
            </span>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export default function WeatherSection() {
  const { current, forecast, locationName, loading } = useVisitorWeather()

  if (loading) return <WeatherSkeleton />
  if (!current) return null

  return (
    <PageSection className="weather-section" title="Weather">
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
            <GlassBacking radius={12} />
            <span className="weather-section-forecast-day">{dayLabel(day.date)}</span>
            <span className="weather-section-forecast-icon" role="img" aria-hidden="true">
              {day.icon}
            </span>
            <span className="weather-section-forecast-temps">
              <span className="weather-section-forecast-high">{Math.round(day.tempMaxC)}°</span>{' '}
              {Math.round(day.tempMinC)}°
            </span>
          </div>
        ))}
      </div>
    </PageSection>
  )
}
