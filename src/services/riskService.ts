import { UserProfile, PolicyTemplate, WeatherData } from '../types';

export const calculateRiskScore = (
  user: UserProfile,
  weather: WeatherData | null,
  historicalData: any = {}
): number => {
  let score = 50; // Base score

  // 1. Job Type Risk
  const jobRisks: Record<string, number> = {
    'food': 20,
    'ecommerce': 10,
    'quick_commerce': 25,
  };
  score += jobRisks[user.category || 'food'] || 0;

  // 2. Weather & Environmental Risk
  if (weather) {
    if (weather.isRisk) score += 30;
    if (weather.temp > 40 || weather.temp < 5) score += 20; // Extreme temperature
    if (weather.windSpeed > 50) score += 20; // Storm risk
    if (weather.aqi && weather.aqi > 150) score += 15; // Poor air quality
  }

  // 3. Location Risk (Factoring in coastal and high-rainfall areas)
  const locationRiskFactors: Record<string, number> = {
    'Mumbai': 25, // High rain/flood risk
    'Delhi': 20, // Extreme temp/AQI risk
    'Chennai': 25, // Coastal/cyclone risk
    'Kolkata': 20, // Coastal risk
    'Visakhapatnam': 30, // High coastal/cyclone/rain risk
    'Vizag': 30, // Alias for Visakhapatnam
    'Bangalore': 10, // Moderate risk
    'Hyderabad': 12, // Moderate risk
    'Pune': 10, // Moderate risk
    'Mangalagiri': 18, // Moderate risk with rain/flood potential
  };

  if (user.location && locationRiskFactors[user.location]) {
    score += locationRiskFactors[user.location];
  } else if (user.location) {
    // Default for other cities
    score += 15;
  }

  // 4. Synergistic Risk (Location + Current Weather)
  if (weather && user.location) {
    const isCoastal = ['Mumbai', 'Chennai', 'Kolkata', 'Visakhapatnam', 'Vizag'].includes(user.location);
    if (isCoastal && (weather.condition === 'Rain' || weather.condition === 'Thunderstorm')) {
      score += 20; // Coastal cities are more vulnerable to rain/storms
    }
  }

  // Normalize score between 0-100
  return Math.min(Math.max(score, 0), 100);
};

export const calculateDynamicPremium = (
  basePremium: number,
  riskScore: number,
  riskCategory: 'low' | 'medium' | 'high',
  location?: string
): number => {
  // Use the provided basePremium as the anchor
  let premium = basePremium;
  
  // Adjust based on risk score (optional, but keeping it for dynamic feel)
  // If risk is very high, increase slightly. If very low, decrease slightly.
  if (riskScore > 80) premium += 10;
  else if (riskScore < 30) premium -= 5;

  // Ensure it doesn't go below a reasonable floor
  return Math.max(premium, 40);
};
