import { useEffect, useState } from "react";
import type { CourseWeather } from "../types";
import { fetchCourseWeather } from "../services/api";

export function useCourseWeather(
  courseId: string | null,
  lat: number | null,
  lng: number | null
) {
  const [weather, setWeather] = useState<CourseWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || lat === null || lng === null) return;

    setLoading(true);
    setError(null);

    fetchCourseWeather(courseId, lat, lng)
      .then((data) => {
        setWeather(data);
        if (!data) setError("Could not load weather.");
      })
      .catch(() => setError("Failed to load weather."))
      .finally(() => setLoading(false));
  }, [courseId, lat, lng]);

  return { weather, loading, error };
}
