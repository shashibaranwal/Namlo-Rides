import { pathDistanceKm } from "../utils/geo";

// Public OSRM demo server — free, keyless, CORS-enabled. Returns a driving
// route as GeoJSON so the driver can travel the real road network instead of a
// straight line. (Client → external API only; no custom backend involved.)
const OSRM = "https://router.project-osrm.org/route/v1/driving";

// Identical from/to pairs are requested by several components (map + driver
// legs), so memoise resolved routes for the session.
const cache = new Map();
const keyOf = (from, to) => `${from.lat},${from.lng};${to.lat},${to.lng}`;

// Degenerate fallback so the app keeps working if OSRM is unreachable.
export function straightRoute(from, to) {
  const path = [
    { lat: from.lat, lng: from.lng },
    { lat: to.lat, lng: to.lng },
  ];
  return { path, distanceKm: pathDistanceKm(path), fallback: true };
}

export async function fetchRoute(from, to) {
  if (!from || !to) return null;

  const key = keyOf(from, to);
  if (cache.has(key)) return cache.get(key);

  const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing failed: ${res.status}`);

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("No route found");

  const result = {
    path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: route.distance / 1000,
    durationSec: route.duration,
  };
  cache.set(key, result);
  return result;
}
