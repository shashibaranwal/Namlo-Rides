import { useEffect, useRef } from "react";
import { pushDriverLocation } from "../services/realtime";
import { TICK_MS, STEP_METERS } from "../config/constants";
import { haversineMeters } from "../utils/geo";

/**
 * Drives the simulated vehicle along a real road `path` ({lat,lng}[]) at a
 * constant speed (STEP_METERS per tick), streaming each position to Firebase.
 * Advancing by distance — not by array index — keeps the speed steady no
 * matter how densely the road geometry is sampled.
 */
export function useDriverSimulation({ tripId, active, path, onArrive }) {
  // Keep onArrive in a ref so changing it never restarts the interval.
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onArriveRef.current = onArrive;
  });

  useEffect(() => {
    if (!active || !tripId || !path || path.length < 2) return;

    // Precompute per-segment lengths + cumulative offsets once.
    const segs = [];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const len = haversineMeters(path[i - 1], path[i]);
      segs.push({ from: path[i - 1], to: path[i], len, acc: total });
      total += len;
    }

    let traveled = 0;
    const interval = setInterval(() => {
      traveled += STEP_METERS;

      if (traveled >= total) {
        clearInterval(interval);
        const end = path[path.length - 1];
        pushDriverLocation(tripId, end.lat, end.lng);
        onArriveRef.current?.();
        return;
      }

      // Interpolate within the segment that contains the travelled distance.
      const seg = segs.find((s) => traveled < s.acc + s.len) || segs[segs.length - 1];
      const t = seg.len ? (traveled - seg.acc) / seg.len : 0;
      const lat = seg.from.lat + (seg.to.lat - seg.from.lat) * t;
      const lng = seg.from.lng + (seg.to.lng - seg.from.lng) * t;
      pushDriverLocation(tripId, lat, lng);
    }, TICK_MS);

    // CLEANUP — clears the interval on unmount / leg change (no leak).
    return () => clearInterval(interval);
  }, [active, tripId, path]);
}
