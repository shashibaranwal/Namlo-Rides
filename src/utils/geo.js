// Great-circle distance between two {lat,lng} points, in metres.
export function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Total length of a polyline ({lat,lng}[]) in kilometres.
export function pathDistanceKm(path) {
  if (!path || path.length < 2) return 0;
  let m = 0;
  for (let i = 1; i < path.length; i++) m += haversineMeters(path[i - 1], path[i]);
  return m / 1000;
}
