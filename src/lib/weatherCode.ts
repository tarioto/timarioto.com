// Maps Open-Meteo's WMO weather codes to a human description and an emoji icon.
// https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")

export interface WeatherLook {
  description: string
  icon: string
}

export function describeWeatherCode(code: number, isDay: boolean): WeatherLook {
  switch (code) {
    case 0:
      return { description: 'clear sky', icon: isDay ? '☀️' : '🌙' }
    case 1:
      return { description: 'mainly clear', icon: isDay ? '🌤️' : '🌙' }
    case 2:
      return { description: 'partly cloudy', icon: isDay ? '⛅' : '☁️' }
    case 3:
      return { description: 'overcast', icon: '☁️' }
    case 45:
    case 48:
      return { description: 'fog', icon: '🌫️' }
    case 51:
      return { description: 'light drizzle', icon: '🌦️' }
    case 53:
      return { description: 'drizzle', icon: '🌦️' }
    case 55:
      return { description: 'heavy drizzle', icon: '🌦️' }
    case 56:
    case 57:
      return { description: 'freezing drizzle', icon: '🌧️' }
    case 61:
      return { description: 'light rain', icon: '🌧️' }
    case 63:
      return { description: 'rain', icon: '🌧️' }
    case 65:
      return { description: 'heavy rain', icon: '🌧️' }
    case 66:
    case 67:
      return { description: 'freezing rain', icon: '🌧️' }
    case 71:
      return { description: 'light snow', icon: '❄️' }
    case 73:
      return { description: 'snow', icon: '❄️' }
    case 75:
      return { description: 'heavy snow', icon: '❄️' }
    case 77:
      return { description: 'snow grains', icon: '❄️' }
    case 80:
    case 81:
      return { description: 'rain showers', icon: '🌦️' }
    case 82:
      return { description: 'heavy rain showers', icon: '🌧️' }
    case 85:
      return { description: 'snow showers', icon: '🌨️' }
    case 86:
      return { description: 'heavy snow showers', icon: '🌨️' }
    case 95:
      return { description: 'thunderstorm', icon: '⛈️' }
    case 96:
    case 99:
      return { description: 'thunderstorm with hail', icon: '⛈️' }
    default:
      return { description: 'unknown', icon: '🌡️' }
  }
}
