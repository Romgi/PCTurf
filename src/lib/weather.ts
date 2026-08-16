import "server-only";

import { getTodayKey, isDateKey } from "@/lib/dates";

const PORT_CARLING = {
  latitude: 45.1168,
  longitude: -79.575,
};
const CELSIUS = "\u00B0C";

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    dew_point_2m?: number;
    precipitation?: number;
    weather_code?: number;
    cloud_cover?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    wind_gusts_10m_max?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
    et0_fao_evapotranspiration?: number[];
  };
};

export type WeatherMetric = {
  label: string;
  value: string;
};

export type WeatherReport = {
  label: string;
  summary: string;
  temperature?: string;
  highLow?: string;
  wind?: string;
  precipitation?: string;
  humidity?: string;
  metrics: WeatherMetric[];
  unavailable?: boolean;
};

function codeLabel(code: number | undefined) {
  if (typeof code !== "number") return "Forecast";
  return WEATHER_CODE_LABELS[code] ?? "Forecast";
}

function round(value: number | undefined) {
  return typeof value === "number" ? Math.round(value) : undefined;
}

function oneDecimal(value: number | undefined) {
  return typeof value === "number" ? value.toFixed(1) : undefined;
}

function timeLabel(value: string | undefined) {
  if (!value) return undefined;
  const time = value.split("T")[1];
  if (!time) return undefined;

  const [hourText, minute = "00"] = time.split(":");
  const hour = Number.parseInt(hourText, 10);
  if (!Number.isFinite(hour)) return undefined;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

function addMetric(metrics: WeatherMetric[], label: string, value?: string) {
  if (value) metrics.push({ label, value });
}

export async function getPortCarlingWeather(date: string): Promise<WeatherReport> {
  if (!isDateKey(date)) {
    return {
      label: "Port Carling, Ontario",
      summary: "Weather unavailable",
      metrics: [],
      unavailable: true,
    };
  }

  const params = new URLSearchParams({
    latitude: String(PORT_CARLING.latitude),
    longitude: String(PORT_CARLING.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset,uv_index_max,et0_fao_evapotranspiration",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "America/Toronto",
    start_date: date,
    end_date: date,
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 15 * 60 },
    });

    if (!response.ok) {
      throw new Error(`Weather request failed with ${response.status}`);
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const daily = payload.daily;
    const index = daily?.time?.findIndex((value) => value === date) ?? -1;
    const dailyIndex = index >= 0 ? index : 0;
    const useCurrent = date === getTodayKey() && Boolean(payload.current);
    const current = payload.current;
    const high = round(daily?.temperature_2m_max?.[dailyIndex]);
    const low = round(daily?.temperature_2m_min?.[dailyIndex]);
    const precipChance = round(daily?.precipitation_probability_max?.[dailyIndex]);
    const precipSum = oneDecimal(daily?.precipitation_sum?.[dailyIndex]);
    const windMax = round(daily?.wind_speed_10m_max?.[dailyIndex]);
    const gustMax = round(daily?.wind_gusts_10m_max?.[dailyIndex]);
    const currentTemperature = round(current?.temperature_2m);
    const feelsLike = round(current?.apparent_temperature);
    const currentWind = round(current?.wind_speed_10m);
    const humidity = round(current?.relative_humidity_2m);
    const highLow = high !== undefined && low !== undefined ? `High ${high}${CELSIUS} / Low ${low}${CELSIUS}` : undefined;
    const precipitation =
      precipChance !== undefined
        ? `${precipChance}% chance${precipSum ? ` / ${precipSum} mm` : ""}`
        : undefined;
    const wind = useCurrent && currentWind !== undefined
      ? `${currentWind} km/h wind`
      : windMax !== undefined
        ? `Wind up to ${windMax} km/h`
        : undefined;
    const metrics: WeatherMetric[] = [];

    if (useCurrent) {
      addMetric(metrics, "Current", currentTemperature !== undefined ? `${currentTemperature}${CELSIUS}` : undefined);
      addMetric(metrics, "Feels like", feelsLike !== undefined ? `${feelsLike}${CELSIUS}` : undefined);
    }
    addMetric(metrics, "High / low", highLow);
    if (useCurrent) {
      addMetric(metrics, "Humidity", humidity !== undefined ? `${humidity}%` : undefined);
      addMetric(metrics, "Dew point", round(current?.dew_point_2m) !== undefined ? `${round(current?.dew_point_2m)}${CELSIUS}` : undefined);
      addMetric(metrics, "Wind now", currentWind !== undefined ? `${currentWind} km/h` : undefined);
      addMetric(metrics, "Gusts now", round(current?.wind_gusts_10m) !== undefined ? `${round(current?.wind_gusts_10m)} km/h` : undefined);
      addMetric(metrics, "Cloud cover", round(current?.cloud_cover) !== undefined ? `${round(current?.cloud_cover)}%` : undefined);
      addMetric(metrics, "Pressure", round(current?.pressure_msl) !== undefined ? `${round(current?.pressure_msl)} hPa` : undefined);
    }
    addMetric(metrics, "Precipitation", precipitation);
    addMetric(metrics, "Peak wind", windMax !== undefined ? `${windMax} km/h` : undefined);
    addMetric(metrics, "Peak gusts", gustMax !== undefined ? `${gustMax} km/h` : undefined);
    addMetric(metrics, "UV index", oneDecimal(daily?.uv_index_max?.[dailyIndex]));
    addMetric(metrics, "ET0", oneDecimal(daily?.et0_fao_evapotranspiration?.[dailyIndex]) ? `${oneDecimal(daily?.et0_fao_evapotranspiration?.[dailyIndex])} mm` : undefined);
    addMetric(metrics, "Sunrise", timeLabel(daily?.sunrise?.[dailyIndex]));
    addMetric(metrics, "Sunset", timeLabel(daily?.sunset?.[dailyIndex]));

    return {
      label: useCurrent ? "Now in Port Carling, Ontario" : "Forecast for Port Carling, Ontario",
      summary: codeLabel(useCurrent ? current?.weather_code : daily?.weather_code?.[dailyIndex]),
      temperature: useCurrent && currentTemperature !== undefined
        ? `${currentTemperature}${CELSIUS}${feelsLike !== undefined ? `, feels ${feelsLike}${CELSIUS}` : ""}`
        : undefined,
      highLow,
      wind,
      precipitation,
      humidity: useCurrent && humidity !== undefined ? `${humidity}% humidity` : undefined,
      metrics,
    };
  } catch {
    return {
      label: "Port Carling, Ontario",
      summary: "Weather unavailable",
      metrics: [],
      unavailable: true,
    };
  }
}
