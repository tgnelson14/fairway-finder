import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { CourseIndex } from "../types";
import type { Theme } from "../contexts/ThemeContext";

function createPinIcon(index: number, isActive: boolean, theme: Theme) {
  const fill = isActive ? theme.primary : theme.surface;
  const stroke = isActive ? 'none' : theme.accent;
  const textColor = isActive ? '#ffffff' : theme.primary;
  const size = isActive ? 32 : 28;

  return L.divIcon({
    html: `
      <svg width="${size}" height="${Math.round(size * 1.35)}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
        <path d="M14 1C7.373 1 2 6.373 2 13c0 8.5 12 24 12 24s12-15.5 12-24c0-6.627-5.373-12-12-12z"
          fill="${fill}" stroke="${stroke}" stroke-width="${isActive ? 0 : 1.5}"/>
        <text x="14" y="15" text-anchor="middle" dominant-baseline="middle"
          font-size="10" font-weight="600" fill="${textColor}" font-family="DM Sans, sans-serif">${index}</text>
      </svg>
    `,
    className: '',
    iconSize: [size, Math.round(size * 1.35)],
    iconAnchor: [size / 2, Math.round(size * 1.35)],
    popupAnchor: [0, -Math.round(size * 1.35)],
  });
}

interface MapViewProps {
  courses: (CourseIndex & { distance: number })[];
  center: { lat: number; lng: number } | null;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (course: CourseIndex & { distance: number }) => void;
  onHover: (id: string | null) => void;
  theme: Theme;
}

function MapUpdater({ center, courses }: { center: { lat: number; lng: number } | null; courses: CourseIndex[] }) {
  const map = useMap();
  const prevCenter = useRef<string>("");

  useEffect(() => {
    const key = center ? `${center.lat},${center.lng}` : "";
    if (key && key !== prevCenter.current) {
      prevCenter.current = key;
      if (courses.length > 0) {
        const bounds = L.latLngBounds(courses.map((c) => [c.lat, c.lng] as [number, number]));
        bounds.extend([center!.lat, center!.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([center!.lat, center!.lng], 11);
      }
    }
  }, [center, courses, map]);

  return null;
}

export function MapView({ courses, center, selectedId, hoveredId, onSelect, onHover, theme }: MapViewProps) {
  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      className="w-full h-full"
      style={{ background: theme.bg }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater center={center} courses={courses} />
      {courses.map((course, i) => {
        const isActive = course.id === selectedId || course.id === hoveredId;
        return (
          <Marker
            key={course.id}
            position={[course.lat, course.lng]}
            icon={createPinIcon(i + 1, isActive, theme)}
            eventHandlers={{
              click: () => onSelect(course),
              mouseover: () => onHover(course.id),
              mouseout: () => onHover(null),
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <strong style={{ fontFamily: 'Playfair Display, serif' }}>{course.n}</strong>
                <br />{course.city}, {course.st}
                {course.par && <><br />Par {course.par}</>}
                {course.yards && <> · {course.yards.toLocaleString()} yds</>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
