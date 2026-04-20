export interface CourseIndex {
  id: string;
  cn: string; // club_name
  n: string; // course_name
  lat: number;
  lng: number;
  city: string;
  st: string; // state
  co: string; // country
  addr: string;
  par: number | null;
  yards: number | null;
  holes: number | null;
  rating: number | null;
  slope: number | null;
}

export interface HoleData {
  par: number;
  yardage: number | null;
  handicap: number | null;
}

export interface TeeData {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  bogey_rating: number;
  total_yards: number;
  total_meters: number;
  number_of_holes: number;
  par_total: number;
  front_course_rating: number;
  front_slope_rating: number;
  front_bogey_rating: number;
  back_course_rating: number;
  back_slope_rating: number;
  back_bogey_rating: number;
  holes: HoleData[];
}

export interface NearbyPoint {
  id: string;
  type: string;
  name: string;
  distanceMiles: number;
}

export interface CourseDetail {
  id: string;
  club_name: string;
  course_name: string;
  phone: string | null;
  website: string | null;
  course_type: string | null;
  year_built: number | null;
  architect: string | null;
  difficulty_percentile: number | null;
  facilities: Record<string, boolean | null>;
  hours: string[];
  tags: string[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  tees: {
    male?: TeeData[];
    female?: TeeData[];
  };
  nearby: NearbyPoint[];
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface CourseWeather {
  current: {
    time: string;
    temperature: number | null;
    apparentTemperature: number | null;
    windSpeed: number | null;
    windGusts: number | null;
    precipitation: number | null;
    weatherCode: number | null;
    isDay: boolean;
  };
  hourly: Array<{
    time: string;
    temperature: number | null;
    precipitationProbability: number | null;
    weatherCode: number | null;
    windSpeed: number | null;
  }>;
  daily: {
    sunrise: string | null;
    sunset: string | null;
  };
}
