import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { GpsPosition } from '../hooks/useGpsPosition';
import { haversineYards } from '../services/overpass';
import type { Theme } from '../contexts/ThemeContext';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// Mapbox Satellite — high-res global imagery (requires VITE_MAPBOX_TOKEN)
// 512px tiles with zoomOffset -1 gives full retina quality in Leaflet
const MAPBOX_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : null;
const MAPBOX_ATTR = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// ESRI fallback when no Mapbox token is configured
const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTR = 'Tiles &copy; Esri';

function playerIcon() {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,0.3);"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function greenIcon() {
  return L.divIcon({
    html: `<svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#16a34a" stroke="#fff" stroke-width="2.5"/>
      <circle cx="11" cy="11" r="3.5" fill="#fff"/>
    </svg>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function MapController({ player, green, fallback, holeNumber }: {
  player: GpsPosition | null;
  green: { lat: number; lng: number } | null;
  fallback: { lat: number; lng: number };
  holeNumber: number;
}) {
  const map = useMap();
  const lastHole = useRef(-1);

  useEffect(() => {
    if (holeNumber === lastHole.current) return;
    lastHole.current = holeNumber;

    if (green) {
      map.setView([green.lat, green.lng], 18, { animate: true });
    } else if (player) {
      map.setView([player.lat, player.lng], 18, { animate: true });
    } else {
      map.setView([fallback.lat, fallback.lng], 17, { animate: true });
    }
  }, [holeNumber, green, player, fallback, map]);

  return null;
}

function ClickHandler({ onTap }: { onTap: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onTap(e.latlng.lat, e.latlng.lng) });
  return null;
}

export interface HoleMapProps {
  holeNumber: number;
  courseLat: number;
  courseLng: number;
  player: GpsPosition | null;
  green: { lat: number; lng: number } | null;
  onSetGreen: (lat: number, lng: number) => void;
  onClearGreen: () => void;
  theme: Theme; // reserved for future themed overlays
}

export function HoleMap({ holeNumber, courseLat, courseLng, player, green, onSetGreen, onClearGreen }: HoleMapProps) {
  const distYards = player && green
    ? haversineYards(player.lat, player.lng, green.lat, green.lng)
    : null;

  const noGreen = !green;

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <MapContainer
        center={[courseLat, courseLng]}
        zoom={18}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        {MAPBOX_URL
          ? <TileLayer url={MAPBOX_URL} attribution={MAPBOX_ATTR} maxZoom={20} tileSize={512} zoomOffset={-1} />
          : <TileLayer url={ESRI_URL} attribution={ESRI_ATTR} maxZoom={19} />
        }

        <MapController
          player={player}
          green={green}
          fallback={{ lat: courseLat, lng: courseLng }}
          holeNumber={holeNumber}
        />

        <ClickHandler onTap={(lat, lng) => onSetGreen(lat, lng)} />

        {player && (
          <Marker position={[player.lat, player.lng]} icon={playerIcon()} />
        )}

        {green && (
          <Marker position={[green.lat, green.lng]} icon={greenIcon()} />
        )}

        {player && green && (
          <Polyline
            positions={[[player.lat, player.lng], [green.lat, green.lng]]}
            pathOptions={{ color: '#fff', weight: 2, opacity: 0.85, dashArray: '6 4' }}
          />
        )}
      </MapContainer>

      {/* Distance overlay — bottom-left of map */}
      {distYards !== null && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          borderRadius: 12, padding: '8px 14px',
          display: 'flex', alignItems: 'baseline', gap: 4,
          pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1,
          }}>
            {distYards.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif' }}>
            yds to green
          </span>
        </div>
      )}

      {/* GPS accuracy chip */}
      {player && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '4px 8px',
          fontSize: 10, color: 'rgba(255,255,255,0.75)',
          fontFamily: 'DM Sans, sans-serif', pointerEvents: 'none',
        }}>
          ±{Math.round(player.accuracy)}m
        </div>
      )}

      {/* Tap-to-set instruction banner */}
      {noGreen && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          borderRadius: 20, padding: '7px 16px',
          fontSize: 12, fontWeight: 600, color: '#fff',
          fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          Tap the green to set distance target
        </div>
      )}

      {/* Clear green pin button */}
      {green && (
        <button
          onClick={onClearGreen}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8,
            padding: '5px 10px', cursor: 'pointer',
            fontSize: 11, color: 'rgba(255,255,255,0.8)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Reset pin
        </button>
      )}

      {/* Attribution — required by both Mapbox and ESRI ToS */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, zIndex: 1000,
        fontSize: 9, color: 'rgba(255,255,255,0.5)',
        background: 'rgba(0,0,0,0.3)', padding: '2px 5px',
        pointerEvents: 'none',
      }}>
        {MAPBOX_URL ? '© Mapbox © OSM' : '© Esri'}
      </div>
    </div>
  );
}
