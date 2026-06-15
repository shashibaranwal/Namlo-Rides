import { useEffect, useRef } from "react";
import { pushDriverLocation } from "../services/realtime";
import { TICK_MS, STEP_FRACTION } from "../config/constants";

export function useDriverSimulation({ tripId, active, from, to, onArrive }) {
  const posRef = useRef(from);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active || !from || !to) return;
    posRef.current = from;

    intervalRef.current = setInterval(() => {
      const p = posRef.current;
      const lat = p.lat + (to.lat - p.lat) * STEP_FRACTION;
      const lng = p.lng + (to.lng - p.lng) * STEP_FRACTION;
      posRef.current = { lat, lng };
      pushDriverLocation(tripId, lat, lng);

      const close =
        Math.abs(to.lat - lat) < 0.0008 && Math.abs(to.lng - lng) < 0.0008;
      if (close) {
        clearInterval(intervalRef.current);
        onArrive?.();
      }
    }, TICK_MS);

    // CLEANUP — the line that prevents the memory leak
    return () => clearInterval(intervalRef.current);
  }, [active, tripId, from, to, onArrive]);
}