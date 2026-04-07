import { useState, useEffect } from "react";
import type { CourseDetail } from "../types";
import { fetchCourseDetail } from "../services/api";

export function useCourseDetail(id: number | null) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;
    setLoading(true);
    setError(null);
    fetchCourseDetail(id)
      .then((data) => {
        setCourse(data);
        if (!data) setError("Could not load course details.");
      })
      .catch(() => setError("Failed to load course details."))
      .finally(() => setLoading(false));
  }, [id]);

  return { course, loading, error };
}
