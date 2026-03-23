import { useEffect } from "react";

export default function wea() {
  useEffect(() => {
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${API_KEY}&units=metric`)
      .then(res => res.json())
      .then(data => console.log(data));
  }, []);

  return <div>Weather Loading...</div>;
}
