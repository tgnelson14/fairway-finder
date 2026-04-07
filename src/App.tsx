import { useState } from "react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { MapView } from "./components/MapView";
import { CourseList } from "./components/CourseList";
import { CourseDetail } from "./components/CourseDetail";
import { useCourseSearch } from "./hooks/useCourseSearch";
import type { CourseIndex } from "./types";
import "./index.css";

function App() {
  const { courses, loading, error, searchedLocation, search } = useCourseSearch();
  const [selectedCourse, setSelectedCourse] = useState<
    (CourseIndex & { distance: number }) | null
  >(null);
  const [detailCourseId, setDetailCourseId] = useState<number | null>(null);
  const [detailCourseName, setDetailCourseName] = useState("");

  const handleSelect = (course: CourseIndex & { distance: number }) => {
    setSelectedCourse(course);
  };

  const handleViewDetail = () => {
    if (selectedCourse) {
      setDetailCourseId(selectedCourse.id);
      setDetailCourseName(selectedCourse.n);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <Header />
      <SearchBar onSearch={search} loading={loading} />

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map */}
        <div className="flex-1 min-h-[300px] lg:min-h-0">
          <MapView
            courses={courses}
            center={searchedLocation}
            selectedId={selectedCourse?.id ?? null}
            onSelect={handleSelect}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-y-auto bg-slate-950">
          {courses.length === 0 && !loading && !error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Find Your Course
              </h3>
              <p className="text-sm text-slate-500">
                Enter a city, zip code, or address to discover nearby golf courses.
              </p>
            </div>
          ) : (
            <>
              <CourseList
                courses={courses}
                selectedId={selectedCourse?.id ?? null}
                onSelect={handleSelect}
              />
            </>
          )}
        </div>
      </div>

      {/* Selected course floating bar */}
      {selectedCourse && !detailCourseId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4 max-w-md">
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">
              {selectedCourse.n}
            </p>
            <p className="text-xs text-slate-400">
              {selectedCourse.distance.toFixed(1)} mi away
              {selectedCourse.par && ` · Par ${selectedCourse.par}`}
            </p>
          </div>
          <button
            onClick={handleViewDetail}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            View Details
          </button>
          <button
            onClick={() => setSelectedCourse(null)}
            className="text-slate-500 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Course detail modal */}
      {detailCourseId && (
        <CourseDetail
          courseId={detailCourseId}
          courseName={detailCourseName}
          onClose={() => setDetailCourseId(null)}
        />
      )}
    </div>
  );
}

export default App;
