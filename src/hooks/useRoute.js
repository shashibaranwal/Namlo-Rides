import { useEffect, useState } from "react";
import { fetchRoute, straightRoute } from "../services/routing";

/**
 * Resolves the road route between two points. Keyed on the primitive
 * coordinates so per-second trip snapshots (new object identities) don't
 * trigger refetches. Falls back to a straight line if OSRM is unreachable so
 * the simulation never stalls. Returns null until the route for the *current*
 * endpoints has resolved (never a stale route for a previous pair).
 */
export function useRoute(from, to) {
  const [state, setState] = useState({ key: null, data: null });

  const fromKey = from ? `${from.lat},${from.lng}` : null;
  const toKey = to ? `${to.lat},${to.lng}` : null;
  const currentKey = fromKey && toKey ? `${fromKey};${toKey}` : null;

  useEffect(() => {
    if (!currentKey) return;

    let alive = true;
    fetchRoute(from, to)
      .then((r) => alive && setState({ key: currentKey, data: r }))
      .catch(() => alive && setState({ key: currentKey, data: straightRoute(from, to) }));

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  return state.key === currentKey ? state.data : null;
}
