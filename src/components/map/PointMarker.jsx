import { memo } from "react";
import { Marker } from "react-leaflet";

// Static pickup / dropoff marker. Memoised on lat/lng so the high-frequency
// driver stream re-rendering the map doesn't recreate these markers each tick.
function PointMarker({ position, icon }) {
  if (!position) return null;
  return <Marker position={[position.lat, position.lng]} icon={icon} />;
}

export default memo(
  PointMarker,
  (a, b) => a.position?.lat === b.position?.lat && a.position?.lng === b.position?.lng
);
