import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Wind, Droplets, MapPin, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { fetchWeatherByCoords, fetchWeatherByCity } from '../services/weatherService';
import { WeatherData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherWidgetProps {
  onWeatherUpdate?: (weather: WeatherData) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onWeatherUpdate }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);

  const getWeatherData = async (lat?: number, lon?: number, city?: string) => {
    setLoading(true);
    setError(null);
    try {
      let data: WeatherData;
      if (city) {
        data = await fetchWeatherByCity(city);
      } else if (lat !== undefined && lon !== undefined) {
        data = await fetchWeatherByCoords(lat, lon);
      } else {
        throw new Error("No location provided");
      }
      setWeather(data);
      setError(null);
      setShowInput(false);
      if (onWeatherUpdate) onWeatherUpdate(data);
      localStorage.setItem('last_weather_city', data.city);
    } catch (err: any) {
      if (err.message.includes("Invalid Weather API key")) {
        setError("Your Weather API key is not active yet. New keys usually take 30-60 minutes to start working. Please try again shortly.");
      } else {
        setError(err.message || "Failed to fetch weather");
      }
      setShowInput(true);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setShowInput(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        getWeatherData(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Location access denied. Please enter your city manually.");
        setShowInput(true);
        setLoading(false);
        
        // Try to load last city if available
        const lastCity = localStorage.getItem('last_weather_city');
        if (lastCity) {
          getWeatherData(undefined, undefined, lastCity);
        }
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCity.trim()) {
      getWeatherData(undefined, undefined, manualCity);
      setShowInput(false);
    }
  };

  if (loading && !weather) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center justify-center min-h-[160px] border border-white/20">
        <RefreshCw className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[32px] p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden group h-full flex flex-col justify-center">
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-30 transition-colors duration-500 ${weather?.isRisk ? 'bg-red-400' : 'bg-white'}`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
              <MapPin className="w-3 h-3" />
              <span>Current Weather</span>
            </div>
            <h3 className="text-4xl font-black text-white flex items-center gap-3">
              {weather?.city || 'Detecting...'}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowInput(!showInput)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Search City"
                >
                  <Search className="w-5 h-5 text-white/40" />
                </button>
                <button 
                  onClick={() => detectLocation()}
                  className={`p-2 hover:bg-white/10 rounded-full transition-colors ${loading ? 'animate-spin' : ''}`}
                  title="Refresh Weather"
                >
                  <RefreshCw className="w-5 h-5 text-white/40" />
                </button>
              </div>
            </h3>
          </div>
          {weather && (
            <div className="text-right">
              <div className="text-6xl font-black text-white leading-none tracking-tighter">
                {weather.temp}°
              </div>
              <div className="text-sm text-emerald-100 font-bold mt-2 uppercase tracking-widest">
                {weather.condition}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showInput && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleManualSearch}
              className="mb-4 overflow-hidden"
            >
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Enter city name (e.g. Mumbai)..."
                  className="flex-1 bg-white/10 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-400 placeholder:text-white/40"
                />
                <button 
                  type="submit"
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Search
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {weather && (
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="p-3 bg-white/20 rounded-xl">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-100 uppercase font-black tracking-widest">Humidity</div>
                <div className="text-xl font-black text-white">{weather.humidity}%</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wind className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-100 uppercase font-black tracking-widest">Wind Speed</div>
                <div className="text-xl font-black text-white">{weather.windSpeed} m/s</div>
              </div>
            </div>
          </div>
        )}

        {weather?.isRisk && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-500 uppercase tracking-wider">
                {weather.riskReason || 'Risk Alert Active'}
              </div>
              <p className="text-[10px] text-red-200/70 leading-relaxed mt-0.5">
                Severe weather detected. Hazard compensation logic is now active for your location.
              </p>
            </div>
          </motion.div>
        )}

        {weather?.lastUpdated && (
          <div className="mt-4 text-center">
            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">
              Last Sync: {new Date(weather.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        )}

        {error && !weather && (
          <div className="mt-4 text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
