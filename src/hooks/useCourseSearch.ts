import { useState, useCallback } from "react";
import type { CourseIndex } from "../types";
import { searchCourses, geocodeLocation } from "../services/api";

interface SearchState {
  courses: (CourseIndex & { distance: number })[];
  loading: boolean;
  error: string | null;
  searchedLocation: { lat: number; lng: number; name: string } | null;
}

export function useCourseSearch() {
  const [state, setState] = useState<SearchState>({
    courses: [],
    loading: false,
    error: null,
    searchedLocation: null,
  });

  const search = useCallback(async (query: string, radius: number = 30) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const geo = await geocodeLocation(query);
      if (!geo) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Could not find that location. Try a city name or zip code.",
        }));
        return;
      }
      const results = await searchCourses(geo.lat, geo.lng, radius);
      setState({
        courses: results,
        loading: false,
        error:
          results.length === 0
            ? `No courses found within ${radius} miles. Try increasing the radius or a different location.`
            : null,
        searchedLocation: { lat: geo.lat, lng: geo.lng, name: geo.displayName },
      });
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Something went wrong. Please try again.",
      }));
    }
  }, []);

  const searchByCoords = useCallback(async (lat: number, lng: number, radius: number = 30) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const results = await searchCourses(lat, lng, radius);
      setState({
        courses: results,
        loading: false,
        error:
          results.length === 0
            ? `No courses found within ${radius} miles. Try increasing the radius.`
            : null,
        searchedLocation: { lat, lng, name: 'Current Location' },
      });
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Something went wrong. Please try again.",
      }));
    }
  }, []);

  return { ...state, search, searchByCoords };
}
