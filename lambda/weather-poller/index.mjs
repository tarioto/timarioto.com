import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const WEATHER_API = 'https://api.openweathermap.org/data/2.5'
const USER_AGENT = 'timarioto.com-weather-poller/1.0 (+https://timarioto.com)'
const FORECAST_DAYS = 5

const s3 = new S3Client({})

function dailyForecast(list, skipDate) {
  const byDate = new Map()

  for (const entry of list) {
    const [date, time] = entry.dt_txt.split(' ')
    if (date === skipDate) continue

    const hour = Number(time.split(':')[0])
    const existing = byDate.get(date)
    if (!existing || Math.abs(hour - 12) < Math.abs(existing.hour - 12)) {
      byDate.set(date, { hour, entry })
    }
  }

  return Array.from(byDate.entries())
    .slice(0, FORECAST_DAYS)
    .map(([date, { entry }]) => ({
      date,
      tempMinC: Math.round(entry.main.temp_min),
      tempMaxC: Math.round(entry.main.temp_max),
      description: entry.weather[0]?.description ?? '',
      icon: entry.weather[0]?.icon ?? null,
    }))
}

export const handler = async () => {
  const apiKey = process.env.WEATHER_API_KEY
  const zip = process.env.WEATHER_ZIP
  const bucket = process.env.SITE_BUCKET

  const currentResponse = await fetch(`${WEATHER_API}/weather?zip=${zip}&units=metric&appid=${apiKey}`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!currentResponse.ok) {
    const body = await currentResponse.text()
    throw new Error(`OpenWeatherMap current weather request failed: ${currentResponse.status} ${currentResponse.statusText} - ${body}`)
  }

  const current = await currentResponse.json()

  const forecastResponse = await fetch(
    `${WEATHER_API}/forecast?lat=${current.coord.lat}&lon=${current.coord.lon}&units=metric&appid=${apiKey}`,
    { headers: { 'User-Agent': USER_AGENT } },
  )
  if (!forecastResponse.ok) {
    const body = await forecastResponse.text()
    throw new Error(`OpenWeatherMap forecast request failed: ${forecastResponse.status} ${forecastResponse.statusText} - ${body}`)
  }

  const forecast = await forecastResponse.json()
  const today = new Date(current.dt * 1000).toISOString().slice(0, 10)

  const payload = {
    updatedAt: new Date().toISOString(),
    location: {
      name: current.name,
      country: current.sys?.country ?? null,
    },
    current: {
      tempC: Math.round(current.main.temp),
      feelsLikeC: Math.round(current.main.feels_like),
      description: current.weather[0]?.description ?? '',
      icon: current.weather[0]?.icon ?? null,
      humidity: current.main.humidity,
      windKph: Math.round(current.wind.speed * 3.6),
    },
    forecast: dailyForecast(forecast.list, today),
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: 'weather.json',
      Body: JSON.stringify(payload),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=1800',
    }),
  )
}
