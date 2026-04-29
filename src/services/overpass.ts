export interface HoleWaypoints {
  holeNumber: number;
  green?: { lat: number; lng: number };
  tee?: { lat: number; lng: number };
}

/** Haversine distance in yards between two lat/lng points. */
export function haversineYards(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const metres = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(metres * 1.09361);
}

/**
 * Fetch golf green/tee waypoints from OpenStreetMap via the free Overpass API.
 * Elements are tagged golf=green or golf=tee with ref=<hole number>.
 * Returns an empty array if the course has no OSM hole data.
 */
export async function fetchGolfHoleWaypoints(
  courseLat: number,
  courseLng: number,
  radiusMetres = 2500,
): Promise<HoleWaypoints[]> {
  const r = radiusMetres;
  const query =
    `[out:json][timeout:15];` +
    `(` +
    `node[golf=green](around:${r},${courseLat},${courseLng});` +
    `way[golf=green](around:${r},${courseLat},${courseLng});` +
    `node[golf=tee](around:${r},${courseLat},${courseLng});` +
    `way[golf=tee](around:${r},${courseLat},${courseLng});` +
    `);` +
    `out center;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass error ${res.status}`);

  const data: { elements: Array<{
    type: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags: Record<string, string>;
  }> } = await res.json();

  const byHole = new Map<number, HoleWaypoints>();

  for (const el of data.elements) {
    const ref = parseInt(el.tags?.ref ?? '', 10);
    if (!ref || ref < 1 || ref > 18) continue;

    const raw = el.type === 'way' ? el.center : { lat: el.lat, lon: el.lon };
    if (!raw?.lat || !raw.lon) continue;
    const coord = { lat: raw.lat, lng: raw.lon };

    if (!byHole.has(ref)) byHole.set(ref, { holeNumber: ref });
    const hole = byHole.get(ref)!;

    if (el.tags.golf === 'green') hole.green = coord;
    if (el.tags.golf === 'tee') hole.tee = coord;
  }

  return Array.from(byHole.values()).sort((a, b) => a.holeNumber - b.holeNumber);
}
