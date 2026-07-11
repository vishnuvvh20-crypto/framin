export enum WeatherCondition {
  Sunny = 1,
  MostlySunny = 2,
  PartlyCloudy = 3,
  MostlyCloudy = 4,
  Cloudy = 5,
  Overcast = 6,
  ClearNight = 7,
  Windy = 8,
  Breezy = 9,
  Gusty = 10,
  Hot = 11,
  Warm = 12,
  Mild = 13,
  Cool = 14,
  Cold = 15,
  Freezing = 16,
  Frost = 17,
  Humid = 18,
  Dry = 19,
  Fog = 20,
  Mist = 21,
  Haze = 22,
  Smoke = 23,
  DustStorm = 24,
  Sandstorm = 25,
  LightRain = 26,
  ModerateRain = 27,
  HeavyRain = 28,
  Drizzle = 29,
  Showers = 30,
  Thunderstorm = 31,
  Lightning = 32,
  Hail = 33,
  Sleet = 34,
  Snow = 35,
  HeavySnow = 36,
  Blizzard = 37,
  IceStorm = 38,
  Cyclone = 39,
  Tornado = 40,
}

// ------------------------------------------------------------------
// Replace these 6 links with your actual hosted weather MP4 videos!
// ------------------------------------------------------------------
const VideoAssets = {
  SUNNY_OR_CLEAR: 'https://github.com/vikash0064/Weather.ai/raw/main/video/clear.mp4',
  CLOUDY: 'https://github.com/vikash0064/Weather.ai/raw/main/video/cloud.mp4',
  RAINY: 'https://github.com/vikash0064/Weather.ai/raw/main/video/rain.mp4',
  SNOWY: 'https://github.com/vikash0064/Weather.ai/raw/main/video/mist.mp4', // using mist as a snowy fallback
  STORMY: 'https://github.com/vikash0064/Weather.ai/raw/main/video/drizzle.mp4', // using drizzle/rain as storm fallback
  FOGGY: 'https://github.com/vikash0064/Weather.ai/raw/main/video/mist.mp4',
};

// Map the 40 conditions into the 6 major video categories
const weatherVideoUrls: Record<WeatherCondition, string> = {
  // Clear/Sunny
  [WeatherCondition.Sunny]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.MostlySunny]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.ClearNight]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.Hot]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.Warm]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.Mild]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.Cool]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.Cold]: VideoAssets.SUNNY_OR_CLEAR,
  [WeatherCondition.Dry]: VideoAssets.SUNNY_OR_CLEAR,

  // Cloudy
  [WeatherCondition.PartlyCloudy]: VideoAssets.CLOUDY,
  [WeatherCondition.MostlyCloudy]: VideoAssets.CLOUDY,
  [WeatherCondition.Cloudy]: VideoAssets.CLOUDY,
  [WeatherCondition.Overcast]: VideoAssets.CLOUDY,
  [WeatherCondition.Windy]: VideoAssets.CLOUDY,
  [WeatherCondition.Breezy]: VideoAssets.CLOUDY,
  [WeatherCondition.Gusty]: VideoAssets.CLOUDY,
  [WeatherCondition.Humid]: VideoAssets.CLOUDY,

  // Fog / Dust
  [WeatherCondition.Fog]: VideoAssets.FOGGY,
  [WeatherCondition.Mist]: VideoAssets.FOGGY,
  [WeatherCondition.Haze]: VideoAssets.FOGGY,
  [WeatherCondition.Smoke]: VideoAssets.FOGGY,
  [WeatherCondition.DustStorm]: VideoAssets.FOGGY,
  [WeatherCondition.Sandstorm]: VideoAssets.FOGGY,

  // Rain
  [WeatherCondition.LightRain]: VideoAssets.RAINY,
  [WeatherCondition.ModerateRain]: VideoAssets.RAINY,
  [WeatherCondition.HeavyRain]: VideoAssets.RAINY,
  [WeatherCondition.Drizzle]: VideoAssets.RAINY,
  [WeatherCondition.Showers]: VideoAssets.RAINY,

  // Snow
  [WeatherCondition.Snow]: VideoAssets.SNOWY,
  [WeatherCondition.HeavySnow]: VideoAssets.SNOWY,
  [WeatherCondition.Blizzard]: VideoAssets.SNOWY,
  [WeatherCondition.Sleet]: VideoAssets.SNOWY,
  [WeatherCondition.Freezing]: VideoAssets.SNOWY,
  [WeatherCondition.Frost]: VideoAssets.SNOWY,
  [WeatherCondition.IceStorm]: VideoAssets.SNOWY,

  // Storm / Extreme
  [WeatherCondition.Thunderstorm]: VideoAssets.STORMY,
  [WeatherCondition.Lightning]: VideoAssets.STORMY,
  [WeatherCondition.Hail]: VideoAssets.STORMY,
  [WeatherCondition.Cyclone]: VideoAssets.STORMY,
  [WeatherCondition.Tornado]: VideoAssets.STORMY,
};

// Maps WMO code to our 40 conditions
export const getConditionForWMOCode = (code: number, isNight: boolean = false): WeatherCondition => {
  if (code === 0) return isNight ? WeatherCondition.ClearNight : WeatherCondition.Sunny;
  if (code === 1) return WeatherCondition.MostlySunny;
  if (code === 2) return WeatherCondition.PartlyCloudy;
  if (code === 3) return WeatherCondition.Overcast;
  if (code === 45 || code === 48) return WeatherCondition.Fog;
  if (code === 51 || code === 53 || code === 55) return WeatherCondition.Drizzle;
  if (code === 56 || code === 57) return WeatherCondition.Sleet;
  if (code === 61) return WeatherCondition.LightRain;
  if (code === 63) return WeatherCondition.ModerateRain;
  if (code === 65) return WeatherCondition.HeavyRain;
  if (code === 66 || code === 67) return WeatherCondition.IceStorm;
  if (code === 71) return WeatherCondition.Snow;
  if (code === 73) return WeatherCondition.Snow;
  if (code === 75) return WeatherCondition.HeavySnow;
  if (code === 77) return WeatherCondition.Snow;
  if (code === 80 || code === 81 || code === 82) return WeatherCondition.Showers;
  if (code === 85 || code === 86) return WeatherCondition.Blizzard;
  if (code === 95) return WeatherCondition.Thunderstorm;
  if (code === 96 || code === 99) return WeatherCondition.Hail;
  return WeatherCondition.Sunny;
};

export const getWeatherVideoUrl = (wmoCode: number, isNight: boolean = false): string => {
  const condition = getConditionForWMOCode(wmoCode, isNight);
  return weatherVideoUrls[condition];
};
