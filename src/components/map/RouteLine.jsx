import { memo } from "react";
import { Polyline } from "react-leaflet";

function RouteLine({ positions, color = "#7b2d3a", dashed = true }) {
  if (!positions || positions.length < 2) return null;
  return (
    <Polyline
      positions={positions.map((p) => [p.lat, p.lng])}
      pathOptions={{ color, weight: 4, opacity: 0.75, dashArray: dashed ? "6 8" : undefined }}
    />
  );
}

// `positions` identity is stable (cached route from useRoute), so a reference
// check skips redrawing the road line on every per-second driver snapshot.
export default memo(
  RouteLine,
  (a, b) => a.positions === b.positions && a.color === b.color && a.dashed === b.dashed
);
