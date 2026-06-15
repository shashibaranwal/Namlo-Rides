import { useEffect, useState } from "react";
import { reverseGeocode } from "../services/geocoding";

/**
 * Resolves a {lat,lng} pin to a human place name. Keyed on the primitive
 * coordinates so new object identities (per-second trip snapshots) don't
 * re-trigger lookups. Returns null until the name for the *current* point has
 * resolved (never a stale name for a previous point); callers fall back to
 * coordinates while null.
 */
export function usePlaceName(point) {
  const [state, setState] = useState({ key: null, name: null });

  const key = point ? `${point.lat},${point.lng}` : null;

  useEffect(() => {
    if (!key) return;

    let alive = true;
    reverseGeocode(point)
      .then((name) => alive && setState({ key, name }))
      .catch(() => alive && setState({ key, name: null }));

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key ? state.name : null;
}
