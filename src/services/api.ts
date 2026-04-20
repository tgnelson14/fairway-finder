import type { CourseIndex, CourseDetail, GeocodingResult } from "../types";

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
  latitude: number;
  longitude: number;
  scorecard?: Array<{
    hole_number: number;
    par: number | null;
    handicap_index: number | null;
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
  teesResponse: OpenGolfTeesResponse
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
    location: {
      address: detail.address ?? "",
      city: detail.city,
      state: detail.state,
      country: detail.country,
      latitude: detail.latitude,
      longitude: detail.longitude,
    },
    tees: groupedTees,
  };
}

export async function fetchCourseDetail(
  id: string
): Promise<CourseDetail | null> {
  if (courseDetailCache.has(id)) return courseDetailCache.get(id)!;
  try {
    const [detailRes, teesRes] = await Promise.all([
      fetch(`/ogapi/courses/${id}`),
      fetch(`/ogapi/courses/${id}/tees`),
    ]);

    if (!detailRes.ok || !teesRes.ok) return null;

    const detail = (await detailRes.json()) as OpenGolfCourseDetail;
    const tees = (await teesRes.json()) as OpenGolfTeesResponse;
    const course = normalizeCourseDetail(detail, tees);
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
