import { lazy, Suspense, useEffect, useState } from 'react'
import './SkyBackground.css'
import { useVisitorLocation } from '../hooks/useVisitorLocation'
import { DAY_MIN_SUN_ALT_DEG, daySkyCssGradient } from '../lib/daySkyPalette'
import { sunPosition } from '../lib/sunPosition'
import Starfield from './Starfield'

// three.js is most of the day sky's weight, so it loads only once it's day.
const DaySky = lazy(() => import('./DaySky'))

const CLOCK_INTERVAL_MS = 30_000

/** The sky behind the page: the sun's path in 3D by day, the starfield by night, for the visitor's own location. */
export default function SkyBackground() {
  const { lat, lon } = useVisitorLocation()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), CLOCK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const { altDeg } = sunPosition(now, lat, lon)
  if (altDeg < DAY_MIN_SUN_ALT_DEG) return <Starfield />

  return (
    <div className="sky-background">
      <Suspense
        fallback={<div className="sky-background-fallback" style={{ background: daySkyCssGradient(altDeg) }} />}
      >
        <DaySky lat={lat} lon={lon} now={now} />
      </Suspense>
    </div>
  )
}
