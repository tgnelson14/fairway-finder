import type {
  CourseIndex,
  CourseDetail,
  CourseWeather,
  GeocodingResult,
} from "../types";

let coursesCache: CourseIndex[] | null = null;

export async function loadCourseIndex(): Promise<CourseIndex[]> {
  if (coursesCache) return coursesCache;
  const res = await fetch("/courses.json");
  coursesCache = await res.json();
  return coursesCache!;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchCourses(
  lat: number,
  lng: number,
  radiusMiles: number = 30
): Promise<(CourseIndex & { distance: number })[]> {
  const courses = await loadCourseIndex();
  return courses
    .map((c) => ({
      ...c,
      distance: haversineDistance(lat, lng, c.lat, c.lng),
    }))
    .filter((c) => c.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}

type OpenGolfCourseDetail = {
  id: string;
  club_name: string;
  course_name: string;
  address: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  course_type: string | null;
  year_built: number | null;
  architect: string | null;
  difficulty_percentile: number | null;
  facilities: Record<string, boolean | null> | null;
  hours_of_operation?: {
    days?: string[];
  } | null;
  course_tags?: string[] | null;
  latitude: number;
  longitude: number;
  scorecard?: Array<{
    hole_number: number;
    par: number | null;
    handicap_index: number | null;
  }>;
};

type OpenGolfNearbyResponse = {
  nearby: Array<{
    id: string;
    poi_type: string;
    name: string;
    distance_miles: number;
  }>;
};

type OpenGolfTeesResponse = {
  tees: Array<{
    tee_name: string;
    gender: "Male" | "Female" | string | null;
    course_rating: number | null;
    slope_rating: number | null;
    bogey_rating: number | null;
    total_yardage: number | null;
    total_meters: number | null;
    par_total: number | null;
    front_nine_rating: number | null;
    front_nine_slope: number | null;
    back_nine_rating: number | null;
    back_nine_slope: number | null;
  }>;
};

const courseDetailCache = new Map<string, CourseDetail>();

function buildHoleData(
  scorecard: OpenGolfCourseDetail["scorecard"],
  totalHoles: number
) {
  return Array.from({ length: totalHoles }, (_, index) => {
    const hole = scorecard?.find((entry) => entry.hole_number === index + 1);
    return {
      par: hole?.par ?? 0,
      yardage: null,
      handicap: hole?.handicap_index ?? null,
    };
  });
}

function normalizeCourseDetail(
  detail: OpenGolfCourseDetail,
  teesResponse: OpenGolfTeesResponse,
  nearbyResponse: OpenGolfNearbyResponse
): CourseDetail {
  const groupedTees = teesResponse.tees.reduce<CourseDetail["tees"]>(
    (acc, tee) => {
      const totalHoles =
        Math.max(
          detail.scorecard?.length ?? 0,
          tee.par_total && tee.par_total <= 40 ? 9 : 18
        ) || 18;

      const normalizedTee = {
        tee_name: tee.tee_name,
        course_rating: tee.course_rating ?? 0,
        slope_rating: tee.slope_rating ?? 0,
        bogey_rating: tee.bogey_rating ?? 0,
        total_yards: tee.total_yardage ?? 0,
        total_meters: tee.total_meters ?? 0,
        number_of_holes: totalHoles,
        par_total: tee.par_total ?? 0,
        front_course_rating: tee.front_nine_rating ?? 0,
        front_slope_rating: tee.front_nine_slope ?? 0,
        front_bogey_rating: 0,
        back_course_rating: tee.back_nine_rating ?? 0,
        back_slope_rating: tee.back_nine_slope ?? 0,
        back_bogey_rating: 0,
        holes: buildHoleData(detail.scorecard, totalHoles),
      };

      if (tee.gender === "Female") {
        acc.female = [...(acc.female ?? []), normalizedTee];
      } else {
        acc.male = [...(acc.male ?? []), normalizedTee];
      }

      return acc;
    },
    {}
  );

  return {
    id: detail.id,
    club_name: detail.club_name,
    course_name: detail.course_name,
    phone: detail.phone,
    website: detail.website,
    course_type: detail.course_type,
    year_built: detail.year_built,
    architect: detail.architect,
    difficulty_percentile: detail.difficulty_percentile,
    facilities: detail.facilities ?? {},
    hours: detail.hours_of_operation?.days ?? [],
    tags: detail.course_tags ?? [],
    location: {
      address: detail.address ?? "",
      city: detail.city,
      state: detail.state,
      country: detail.country,
      postalCode: detail.postal_code ?? "",
      latitude: detail.latitude,
      longitude: detail.longitude,
    },
    tees: groupedTees,
    nearby: nearbyResponse.nearby.map((poi) => ({
      id: poi.id,
      type: poi.poi_type,
      name: poi.name,
      distanceMiles: poi.distance_miles,
    })),
  };
}

export async function fetchCourseDetail(
  id: string
): Promise<CourseDetail | null> {
  if (courseDetailCache.has(id)) return courseDetailCache.get(id)!;
  try {
    const [detailRes, teesRes, nearbyRes] = await Promise.all([
      fetch(`/ogapi/courses/${id}`),
      fetch(`/ogapi/courses/${id}/tees`),
      fetch(`/ogapi/courses/${id}/nearby`),
    ]);

    if (!detailRes.ok || !teesRes.ok || !nearbyRes.ok) return null;

    const detail = (await detailRes.json()) as OpenGolfCourseDetail;
    const tees = (await teesRes.json()) as OpenGolfTeesResponse;
    const nearby = (await nearbyRes.json()) as OpenGolfNearbyResponse;
    const course = normalizeCourseDetail(detail, tees, nearby);
    courseDetailCache.set(id, course);
    return course;
  } catch {
    return null;
  }
}

export async function geocodeLocation(
  query: string
): Promise<GeocodingResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { "User-Agent": "FairwayFinder/1.0" } }
    );
    const results = await res.json();
    if (results.length === 0) return null;
    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}

type OpenMeteoResponse = {
  current?: {
    time: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
    precipitation?: number;
    weather_code?: number;
    is_day?: number;
  };
  hourly?: {
    time: string[];
    temperature_2m?: Array<number | null>;
    precipitation_probability?: Array<number | null>;
    weather_code?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
  };
  daily?: {
    sunrise?: string[];
    sunset?: string[];
  };
};

const courseWeatherCache = new Map<string, CourseWeather>();

export async function fetchCourseWeather(
  courseId: string,
  lat: number,
  lng: number
): Promise<CourseWeather | null> {
  if (courseWeatherCache.has(courseId)) return courseWeatherCache.get(courseId)!;

  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: [
        "temperature_2m",
        "apparent_temperature",
        "wind_speed_10m",
        "wind_gusts_10m",
        "precipitation",
        "weather_code",
        "is_day",
      ].join(","),
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
      daily: ["sunrise", "sunset"].join(","),
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      forecast_days: "1",
      timezone: "auto",
    });

    const res = await fetch(`/weather?${params.toString()}`);
    if (!res.ok) return null;

    const data = (await res.json()) as OpenMeteoResponse;
    if (!data.current || !data.hourly?.time?.length) return null;

    const hourly = data.hourly.time.slice(0, 8).map((time, index) => ({
      time,
      temperature: data.hourly?.temperature_2m?.[index] ?? null,
      precipitationProbability:
        data.hourly?.precipitation_probability?.[index] ?? null,
      weatherCode: data.hourly?.weather_code?.[index] ?? null,
      windSpeed: data.hourly?.wind_speed_10m?.[index] ?? null,
    }));

    const weather: CourseWeather = {
      current: {
        time: data.current.time,
        temperature: data.current.temperature_2m ?? null,
        apparentTemperature: data.current.apparent_temperature ?? null,
        windSpeed: data.current.wind_speed_10m ?? null,
        windGusts: data.current.wind_gusts_10m ?? null,
        precipitation: data.current.precipitation ?? null,
        weatherCode: data.current.weather_code ?? null,
        isDay: data.current.is_day === 1,
      },
      hourly,
      daily: {
        sunrise: data.daily?.sunrise?.[0] ?? null,
        sunset: data.daily?.sunset?.[0] ?? null,
      },
    };

    courseWeatherCache.set(courseId, weather);
    return weather;
  } catch {
    return null;
  }
}
