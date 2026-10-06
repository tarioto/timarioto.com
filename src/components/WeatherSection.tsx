import './WeatherSection.css'
import { type ForecastDay, useVisitorWeather } from '../hooks/useVisitorWeather'
import GlassBacking from './GlassBacking'
import PageSection from './PageSection'
import Skeleton from './Skeleton'

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}

// One forecast card, or its placeholder while the weather loads. Keyed by
// position, so each placeholder becomes the loaded card in place and keeps
// its glass rather than rebuilding it.
function ForecastCard({ day }: { day?: ForecastDay }) {
  return (
    <div className="weather-section-forecast-card">
      <GlassBacking radius={12} />
      <span className="weather-section-forecast-day">{day ? dayLabel(day.date) : <Skeleton width="2.5em" />}</span>
      <span className="weather-section-forecast-icon" role="img" aria-hidden="true">
        {day ? day.icon : <Skeleton width="1em" />}
      </span>
      <span className="weather-section-forecast-temps">
        {day ? (
          <>
            <span className="weather-section-forecast-high">{Math.round(day.tempMaxC)}°</span>{' '}
            {Math.round(day.tempMinC)}°
          </>
        ) : (
          <Skeleton width="3.5em" />
        )}
      </span>
    </div>
  )
}

const PLACEHOLDER_DAYS: undefined[] = Array(5).fill(undefined)

// Renders the same panel while loading and once loaded, swapping only its
// contents, so the panel's glass isn't torn down and rebuilt mid-load.
export default function WeatherSection() {
  const { current, forecast, locationName, loading, status } = useVisitorWeather()

  if (status === 'unanswered') {
    return (
      <PageSection className="weather-section" title="Weather">
        <div className="weather-section-current">
          <span className="weather-section-current-icon" role="img" aria-hidden="true">
            🌞
          </span>
          <p className="weather-section-message">No location available</p>
        </div>
      </PageSection>
    )
  }

  if (!loading && !current) return null

  return (
    <PageSection className="weather-section" title="Weather" aria-busy={loading || undefined}>
      <div className="weather-section-current">
        <span className="weather-section-current-icon" role="img" aria-hidden="true">
          {current ? current.icon : <Skeleton width="1em" />}
        </span>
        <div>
          <span className="weather-section-temp">
            {current ? `${Math.round(current.tempC)}°C` : <Skeleton width="2.5em" />}
          </span>
          <p className="weather-section-description">
            {current ? (
              <>
                {current.description}
                {locationName ? ` in ${locationName}` : ' near you'}
              </>
            ) : (
              <Skeleton width="12em" />
            )}
          </p>
        </div>
      </div>
      <div className="weather-section-forecast">
        {(current ? forecast : PLACEHOLDER_DAYS).map((day, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: keyed by slot so a placeholder card becomes its loaded card in place.
          <ForecastCard day={day} key={i} />
        ))}
      </div>
    </PageSection>
  )
}
