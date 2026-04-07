import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { CourseIndex } from "../types";

// Fix Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "selected-marker",
});

interface MapViewProps {
  courses: (CourseIndex & { distance: number })[];
  center: { lat: number; lng: number } | null;
  selectedId: number | null;
  onSelect: (course: CourseIndex & { distance: number }) => void;
}

function MapUpdater({
  center,
  courses,
}: {
  center: { lat: number; lng: number } | null;
  courses: CourseIndex[];
}) {
  const map = useMap();
  const prevCenter = useRef<string>("");

  useEffect(() => {
    const key = center ? `${center.lat},${center.lng}` : "";
    if (key && key !== prevCenter.current) {
      prevCenter.current = key;
      if (courses.length > 0) {
        const bounds = L.latLngBounds(
          courses.map((c) => [c.lat, c.lng] as [number, number])
        );
        bounds.extend([center!.lat, center!.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([center!.lat, center!.lng], 11);
      }
    }
  }, [center, courses, map]);

  return null;
}

export function MapView({ courses, center, selectedId, onSelect }: MapViewProps) {
  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      className="w-full h-full"
      style={{ background: "#0f172a" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater center={center} courses={courses} />
      {courses.map((course) => (
        <Marker
          key={course.id}
          position={[course.lat, course.lng]}
          icon={course.id === selectedId ? selectedIcon : defaultIcon}
          eventHandlers={{ click: () => onSelect(course) }}
        >
          <Popup>
            <div className="text-slate-900">
              <strong>{course.n}</strong>
              <br />
              {course.city}, {course.st}
              {course.par && <><br />Par {course.par}</>}
              {course.yards && <> &middot; {course.yards.toLocaleString()} yds</>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
