import { useEffect, useState } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { useCourseSearch } from "./hooks/useCourseSearch";
import { HomeScreen } from "./components/HomeScreen";
import { CourseCard } from "./components/CourseCard";
import { CourseDetail } from "./components/CourseDetail";
import { FiltersPanel } from "./components/FiltersPanel";
import { MapView } from "./components/MapView";
import { UserPanel } from "./components/UserPanel";
import type { CourseIndex } from "./types";
import "./index.css";

type SortOption = "distance" | "rating" | "name";

interface Filters {
  holes: string;
}

function App() {
  const { theme } = useTheme();
  const { user, login } = useAuth();
  const { courses, loading, error, searchedLocation, search, searchByCoords } = useCourseSearch();

  const [screen, setScreen] = useState<"home" | "results">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRadius, setSearchRadius] = useState(30);
  const [selectedCourse, setSelectedCourse] = useState<(CourseIndex & { distance: number }) | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [sort, setSort] = useState<SortOption>("distance");
  const [filters, setFilters] = useState<Filters>({ holes: "Any" });
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const detailPaneWidth = showDetail ? "min(58vw, 620px)" : "360px";

  const favKey = user ? `favorites-${user.id}` : "favorite-course-ids";

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(favKey) || "[]");
      setFavoriteIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFavoriteIds([]);
    }
  }, [favKey]);

  const handleSearch = (query: string, radius: number) => {
    setSearchQuery(query);
    setSearchRadius(radius);
    search(query, radius);
    setScreen("results");
    setSelectedCourse(null);
    setShowDetail(false);
    setMobileView("list");
  };

  const handleSearchByCoords = (lat: number, lng: number, radius: number) => {
    setSearchQuery("");
    setSearchRadius(radius);
    searchByCoords(lat, lng, radius);
    setScreen("results");
    setSelectedCourse(null);
    setShowDetail(false);
    setMobileView("list");
  };

  const handleSelectCourse = (course: CourseIndex & { distance: number }) => {
    setSelectedCourse(course);
    setShowDetail(true);
    setMobileView("list");
  };

  const handleToggleFavorite = (courseId: string) => {
    setFavoriteIds((current) => {
      const next = current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId];
      window.localStorage.setItem(favKey, JSON.stringify(next));
      return next;
    });
  };

  const filteredCourses = courses
    .filter(c => filters.holes === "Any" || c.holes === +filters.holes)
    .sort((a, b) => {
      const aFav = favoriteIds.includes(a.id);
      const bFav = favoriteIds.includes(b.id);
      if (aFav !== bFav) return aFav ? -1 : 1;
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

        <div className="hide-mobile" style={{
          fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700,
          color: theme.primary, letterSpacing: "-0.02em", whiteSpace: "nowrap",
        }}>
          Fairway
        </div>

        <button
          onClick={() => user ? setShowUserPanel(true) : login()}
          style={{
            background: user ? theme.primary : "none",
            border: user ? "none" : `1px solid ${theme.border}`,
            cursor: "pointer", borderRadius: "50%",
            width: 34, height: 34, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: user ? "#fff" : theme.textSub,
            fontSize: 13, fontWeight: 600,
            fontFamily: "DM Sans, sans-serif",
          }}
          title={user ? "My profile" : "Sign in"}
        >
          {user
            ? (user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()
            : (
              <svg width="16" height="16" fill="none" stroke={theme.textSub} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )
          }
        </button>
      </div>

      {showUserPanel && (
        <UserPanel
          onClose={() => setShowUserPanel(false)}
          theme={theme}
          favoriteCount={favoriteIds.length}
        />
      )}

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
        <div
          className={`pane-sidebar${mobileView === "map" ? " hide-mobile" : ""}`}
          style={{
            width: detailPaneWidth, background: theme.surface,
            borderRight: `1px solid ${theme.border}`,
            display: "flex", flexDirection: "column",
            flexShrink: 0, position: "relative",
            transition: "width 0.22s ease",
          }}
        >
          {/* Sidebar header */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                {loading ? "Searching…" : `${filteredCourses.length} courses found${favoriteIds.length ? ` • ${favoriteIds.length} saved` : ""}`}
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
                isFavorite={favoriteIds.includes(course.id)}
                onSelect={() => handleSelectCourse(course)}
                onHover={setHoveredId}
                onToggleFavorite={handleToggleFavorite}
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
              isFavorite={favoriteIds.includes(selectedCourse.id)}
              onToggleFavorite={handleToggleFavorite}
              theme={theme}
            />
          )}
        </div>

        {/* Map */}
        <div
          className={mobileView === "list" ? "hide-mobile" : ""}
          style={{ flex: 1, position: "relative" }}
        >
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

      {/* Mobile tab bar — list / map toggle */}
      <div
        className="mobile-tab-bar"
        style={{
          background: theme.surface,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => setMobileView("list")}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
            color: mobileView === "list" ? theme.primary : theme.textMuted,
            fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 500,
            padding: 0,
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          List
        </button>
        <button
          onClick={() => setMobileView("map")}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
            color: mobileView === "map" ? theme.primary : theme.textMuted,
            fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: 500,
            padding: 0,
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Map
        </button>
      </div>
    </div>
  );
}

export default App;
