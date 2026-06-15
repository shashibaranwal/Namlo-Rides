import { usePlaceName } from "../../hooks/usePlaceName";

// Coordinates shown only as a transient fallback while the place name resolves
// (or if reverse geocoding fails).
const coords = (p) => `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;

/**
 * Renders the place name for a {lat,lng} pin, falling back to coordinates while
 * the lookup is in flight and to `empty` when there is no pin.
 */
export default function PlaceLabel({ point, empty = "—" }) {
  const name = usePlaceName(point);
  if (!point) return empty;
  return name || coords(point);
}
