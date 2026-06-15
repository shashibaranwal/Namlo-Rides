const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

// The same pins are reverse-geocoded by several components (rider/driver panels,
// request list, history), so memoise resolved names for the session. Rounding
// the key keeps near-identical coordinates on a single lookup.
const cache = new Map();
const keyOf = (p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;

// Build a short, readable label from Nominatim's address breakdown: a primary
// feature (named place or road) plus a surrounding area, de-duplicated.
function shortLabel(data) {
  const a = data.address || {};
  const primary =
    data.name ||
    a.road ||
    a.pedestrian ||
    a.neighbourhood ||
    a.suburb ||
    a.hamlet ||
    a.village ||
    a.town ||
    a.city;
  const area = a.suburb || a.neighbourhood || a.city_district || a.city || a.town || a.village || a.county;

  const parts = [primary, area].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
  if (parts.length) return parts.slice(0, 2).join(", ");

  // Fall back to the first chunks of the full display name.
  return data.display_name ? data.display_name.split(",").slice(0, 2).join(",").trim() : null;
}

export async function reverseGeocode(point) {
  if (!point) return null;

  const key = keyOf(point);
  if (cache.has(key)) return cache.get(key);

  const url = `${NOMINATIM}?format=jsonv2&lat=${point.lat}&lon=${point.lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);

  const data = await res.json();
  const label = shortLabel(data);
  cache.set(key, label);
  return label;
}
