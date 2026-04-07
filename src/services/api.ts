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

const courseDetailCache = new Map<number, CourseDetail>();

export async function fetchCourseDetail(
  id: number
): Promise<CourseDetail | null> {
  if (courseDetailCache.has(id)) return courseDetailCache.get(id)!;
  try {
    const res = await fetch(`/api/courses/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const course = data.course as CourseDetail;
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
