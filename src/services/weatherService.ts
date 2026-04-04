import { WeatherData } from "../types";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const RISK_CONDITIONS = ["Thunderstorm", "Snow", "Tornado", "Squall", "Ash", "Sand", "Dust", "Haze"];

export const fetchWeatherByCoords = async (lat: number, lon: number): Promise<WeatherData> => {
  if (!API_KEY) {
    throw new Error("Weather API key not configured. Please add VITE_OPENWEATHER_API_KEY to your secrets.");
  }

  const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401) {
      throw new Error("Invalid Weather API key. Please check your VITE_OPENWEATHER_API_KEY in secrets.");
    }
    throw new Error(errorData.message || "Failed to fetch weather data for your location.");
  }

  const data = await response.json();
  return formatWeatherData(data);
};

export const fetchWeatherByCity = async (city: string): Promise<WeatherData> => {
  if (!API_KEY) {
    throw new Error("Weather API key not configured. Please add VITE_OPENWEATHER_API_KEY to your secrets.");
  }

  const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401) {
      throw new Error("Invalid Weather API key. Please check your VITE_OPENWEATHER_API_KEY in secrets.");
    }
    throw new Error(errorData.message || `Failed to fetch weather data for "${city}".`);
  }

  const data = await response.json();
  return formatWeatherData(data);
};

const formatWeatherData = (data: any): WeatherData => {
  const condition = data.weather[0].main;
  const description = data.weather[0].description.toLowerCase();
  
  // More nuanced risk detection
  // Only trigger for heavy rain or severe conditions
  const isHeavyRain = condition === "Rain" && (description.includes("heavy") || description.includes("extreme") || description.includes("very"));
  const isExtremeTemp = data.main.temp < 3 || data.main.temp > 46;
  const isExtremeWind = data.wind.speed > 25; // ~90 km/h
  const isExtremeHumidity = data.main.humidity > 98;

  const isRisk = RISK_CONDITIONS.includes(condition) || isHeavyRain || isExtremeTemp || isExtremeWind || isExtremeHumidity;
  
  let riskReason = "";
  if (isRisk) {
    if (RISK_CONDITIONS.includes(condition)) riskReason = `Severe ${condition}`;
    else if (isHeavyRain) riskReason = "Heavy Rainfall";
    else if (isExtremeTemp) riskReason = data.main.temp > 46 ? "Extreme Heatwave" : "Extreme Coldwave";
    else if (isExtremeWind) riskReason = "High Wind Warning";
    else if (isExtremeHumidity) riskReason = "Extreme Humidity";
  }

  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    condition: condition,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    isRisk,
    riskReason,
    lastUpdated: new Date().toISOString(),
  };
};
