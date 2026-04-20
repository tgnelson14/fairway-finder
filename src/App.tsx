import { useState } from "react";
import { useTheme, THEMES, type ThemeName } from "./contexts/ThemeContext";
import { useCourseSearch } from "./hooks/useCourseSearch";
import { HomeScreen } from "./components/HomeScreen";
import { CourseCard } from "./components/CourseCard";
import { CourseDetail } from "./components/CourseDetail";
import { FiltersPanel } from "./components/FiltersPanel";
import { MapView } from "./components/MapView";
import type { CourseIndex } from "./types";
import "./index.css";

type SortOption = "distance" | "rating" | "name";

interface Filters {
  holes: string;
}

function App() {
  const { theme, themeName, setTheme } = useTheme();
  const { courses, loading, error, searchedLocation, search, searchByCoords } = useCourseSearch();

  const [screen, setScreen] = useState<"home" | "results">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(30);
  const [selectedCourse, setSelectedCourse] = useState<(CourseIndex & { distance: number }) | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortOption>("distance");
  const [filters, setFilters] = useState<Filters>({ holes: "Any" });

  const handleSearch = (query: string, radius: number) => {
    setSearchQuery(query);
    setSearchRadius(radius);
    search(query, radius);
    setScreen("results");
    setSelectedCourse(null);
    setShowDetail(false);
  };

  const handleSearchByCoords = (lat: number, lng: number, radius: number) => {
    setSearchQuery("");
    setSearchRadius(radius);
    searchByCoords(lat, lng, radius);
    setScreen("results");
    setSelectedCourse(null);
    setShowDetail(false);
  };

  const handleSelectCourse = (course: CourseIndex & { distance: number }) => {
    setSelectedCourse(course);
    setShowDetail(true);
  };

  const filteredCourses = courses
    .filter(c => filters.holes === "Any" || c.holes === +filters.holes)
    .sort((a, b) => {
      if (sort === "distance") return a.distance - b.distance;
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return a.n.localeCompare(b.n);
    });

  if (screen === "home") {
    return (
      <HomeScreen
        onSearch={handleSearch}
        onSearchByCoords={handleSearchByCoords}
        loading={loading}
        theme={theme}
        themeName={themeName}
        setTheme={setTheme}
      />
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: theme.bg, overflow: "hidden" }}>
      {/* Navbar */}
      <div style={{
        height: 56, background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px", flexShrink: 0, zIndex: 5,
      }}>
        <button
          onClick={() => setScreen("home")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}
        >
          <svg width="18" height="18" fill="none" stroke={theme.textSub} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", background: theme.surfaceAlt,
          borderRadius: 10, border: `1px solid ${theme.border}`,
        }}>
          <svg width="14" height="14" fill="none" stroke={theme.textMuted} strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            defaultValue={searchQuery}
            placeholder="Search location…"
            onKeyDown={e => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) handleSearch(v, searchRadius);
              }
            }}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", fontSize: 13,
              color: theme.text, fontFamily: "DM Sans, sans-serif",
            }}
          />
          <svg width="14" height="14" fill="none" stroke={theme.accent} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>

        <div style={{
          fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700,
          color: theme.primary, letterSpacing: "-0.02em", whiteSpace: "nowrap",
        }}>
          Fairway
        </div>

        {/* Theme dots */}
        <div style={{ display: "flex", gap: 5, marginLeft: 4 }}>
          {(Object.keys(THEMES) as ThemeName[]).map(key => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              title={THEMES[key].name}
              style={{
                width: 18, height: 18, borderRadius: "50%",
                background: THEMES[key].primary,
                border: `2px solid ${themeName === key ? theme.accent : "transparent"}`,
                cursor: "pointer", padding: 0, transition: "border-color 0.15s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div style={{
          padding: "10px 16px",
          background: theme.danger + "18",
          borderBottom: `1px solid ${theme.danger}40`,
          fontSize: 13, color: theme.danger,
        }}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: 340, background: theme.surface,
          borderRight: `1px solid ${theme.border}`,
          display: "flex", flexDirection: "column",
          flexShrink: 0, position: "relative",
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                {loading ? "Searching…" : `${filteredCourses.length} courses found`}
              </span>
              <button
                onClick={() => setShowFilters(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", borderRadius: 8,
                  border: `1px solid ${theme.border}`, background: "none",
                  cursor: "pointer", fontSize: 12, color: theme.textSub,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                <svg width="13" height="13" fill="none" stroke={theme.textSub} strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filters
              </button>
            </div>

            {/* Sort buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              {([["distance", "Nearest"], ["rating", "Top Rated"], ["name", "A–Z"]] as [SortOption, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSort(val)}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 8,
                    border: `1px solid ${sort === val ? theme.primary : theme.border}`,
                    background: sort === val ? theme.primary : "none",
                    color: sort === val ? "#fff" : theme.textSub,
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif", transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Course list */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {loading && (
              <div style={{ padding: 32, textAlign: "center", color: theme.textMuted, fontSize: 13 }}>
                <svg style={{ animation: "spin 1s linear infinite", display: "inline-block", marginBottom: 8 }}
                  width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke={theme.primary} strokeWidth="4"/>
                  <path opacity="0.75" fill={theme.primary} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <br/>Loading courses…
              </div>
            )}
            {!loading && filteredCourses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                selected={selectedCourse?.id === course.id}
                hovered={hoveredId === course.id}
                onSelect={() => handleSelectCourse(course)}
                onHover={setHoveredId}
                theme={theme}
              />
            ))}
            {!loading && filteredCourses.length === 0 && courses.length > 0 && (
              <div style={{ padding: 32, textAlign: "center", color: theme.textMuted, fontSize: 13 }}>
                No courses match your filters
              </div>
            )}
          </div>

          {/* Overlays */}
          {showFilters && (
            <FiltersPanel
              onClose={() => setShowFilters(false)}
              filters={filters}
              setFilters={setFilters}
              radius={searchRadius}
              onApply={(newRadius) => {
                setShowFilters(false);
                if (newRadius !== searchRadius && searchQuery) {
                  handleSearch(searchQuery, newRadius);
                } else {
                  setSearchRadius(newRadius);
                }
              }}
              theme={theme}
            />
          )}
          {showDetail && selectedCourse && (
            <CourseDetail
              courseId={selectedCourse.id}
              course={selectedCourse}
              onClose={() => { setShowDetail(false); setSelectedCourse(null); }}
              theme={theme}
            />
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapView
            courses={filteredCourses}
            center={searchedLocation}
            selectedId={selectedCourse?.id ?? null}
            hoveredId={hoveredId}
            onSelect={handleSelectCourse}
            onHover={setHoveredId}
            theme={theme}
          />

          {/* Map attribution */}
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            fontSize: 10, color: theme.textMuted,
            background: theme.surface + "cc",
            padding: "3px 6px", borderRadius: 4,
          }}>
            Fairway Maps © 2026
          </div>

          {/* Hover tooltip */}
          {hoveredId && !showDetail && (() => {
            const c = courses.find(x => x.id === hoveredId);
            return c ? (
              <div style={{
                position: "absolute", bottom: 24, left: "50%",
                transform: "translateX(-50%)",
                background: theme.surface, padding: "10px 16px",
                borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                border: `1px solid ${theme.border}`, whiteSpace: "nowrap",
                pointerEvents: "none",
              }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 14, fontWeight: 600, color: theme.text }}>
                  {c.n}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {c.rating && (
                    <span style={{ fontSize: 12, color: theme.accent, fontWeight: 600 }}>
                      Rating {c.rating.toFixed(1)}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: theme.textSub }}>{c.distance.toFixed(1)} mi</span>
                  {c.holes && <span style={{ fontSize: 12, color: theme.textSub }}>{c.holes} holes</span>}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}

export default App;
