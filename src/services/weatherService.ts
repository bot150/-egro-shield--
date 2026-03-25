import { WeatherData } from "../types";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

const RISK_CONDITIONS = ["Rain", "Thunderstorm", "Drizzle", "Snow", "Tornado", "Squall"];

export const fetchWeatherByCoords = async (lat: number, lon: number): Promise<WeatherData> => {
  if (!API_KEY) {
    console.warn("Weather API key not configured. Using mock data.");
    let cityName = "Detected Location";
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon} and units=metric&appid=${API_KEY}`);
      if (res.ok) {
        const geoData = await res.json();
        cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Detected Location";
      }
    } catch(e) { /* ignore fallback error */ }

    return {
      city: cityName,
      temp: 28,
      condition: "Clear",
      description: "clear sky",
      humidity: 50,
      windSpeed: 3.5,
      icon: "https://openweathermap.org/img/wn/01d@2x.png",
      isRisk: false,
    };
  }

  const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&appid=${API_KEY}`);
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
    console.warn("Weather API key not configured. Using mock data.");
    return {
      city: city || "New Delhi",
      temp: 30,
      condition: "Clouds",
      description: "scattered clouds",
      humidity: 60,
      windSpeed: 4.1,
      icon: "https://openweathermap.org/img/wn/03d@2x.png",
      isRisk: false,
    };
  }

  const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric&appid=${API_KEY}`);
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
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    condition: condition,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    isRisk: RISK_CONDITIONS.includes(condition) || data.main.temp < 5 || data.main.temp > 40,
  };
};
