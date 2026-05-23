import "server-only";

import { getTodayKey, isDateKey } from "@/lib/dates";

const PORT_CARLING = {
  latitude: 45.1168,
  longitude: -79.575,
};

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
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
  };
};

export type WeatherReport = {
  label: string;
  summary: string;
  temperature?: string;
  highLow?: string;
  wind?: string;
  precipitation?: string;
  humidity?: string;
  unavailable?: boolean;
};

function codeLabel(code: number | undefined) {
  if (typeof code !== "number") return "Forecast";
  return WEATHER_CODE_LABELS[code] ?? "Forecast";
}

function round(value: number | undefined) {
  return typeof value === "number" ? Math.round(value) : undefined;
}

export async function getPortCarlingWeather(date: string): Promise<WeatherReport> {
  if (!isDateKey(date)) {
    return {
      label: "Port Carling, Ontario",
      summary: "Weather unavailable",
      unavailable: true,
    };
  }

  const params = new URLSearchParams({
    latitude: String(PORT_CARLING.latitude),
    longitude: String(PORT_CARLING.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
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
    const today = getTodayKey();
    const useCurrent = date === today && payload.current;
    const current = payload.current;
    const dailyCode = daily?.weather_code?.[dailyIndex];
    const currentCode = current?.weather_code;
    const high = round(daily?.temperature_2m_max?.[dailyIndex]);
    const low = round(daily?.temperature_2m_min?.[dailyIndex]);
    const precipChance = round(daily?.precipitation_probability_max?.[dailyIndex]);
    const precipSum = daily?.precipitation_sum?.[dailyIndex];
    const windMax = round(daily?.wind_speed_10m_max?.[dailyIndex]);

    return {
      label: useCurrent ? "Now in Port Carling, Ontario" : "Forecast for Port Carling, Ontario",
      summary: codeLabel(useCurrent ? currentCode : dailyCode),
      temperature: useCurrent
        ? `${round(current?.temperature_2m)} C, feels ${round(current?.apparent_temperature)} C`
        : undefined,
      highLow: high !== undefined && low !== undefined ? `High ${high} C / Low ${low} C` : undefined,
      wind: useCurrent
        ? `${round(current?.wind_speed_10m)} km/h wind`
        : windMax !== undefined
          ? `Wind up to ${windMax} km/h`
          : undefined,
      precipitation:
        precipChance !== undefined
          ? `${precipChance}% precip${typeof precipSum === "number" ? ` / ${precipSum.toFixed(1)} mm` : ""}`
          : undefined,
      humidity: useCurrent && current?.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}% humidity` : undefined,
    };
  } catch {
    return {
      label: "Port Carling, Ontario",
      summary: "Weather unavailable",
      unavailable: true,
    };
  }
}
