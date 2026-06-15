import { useEffect, useRef, memo } from "react";
import { Marker } from "react-leaflet";
import { driverIcon } from "./markers";

// Live driver position. Updates the marker imperatively via setLatLng so a
// per-second location stream moves the dot without churning React/Leaflet
// internals. memo keeps it from re-rendering when unrelated trip fields change.
const DriverMarker = memo(function DriverMarker({ position }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && position) {
      ref.current.setLatLng([position.lat, position.lng]);
    }
  }, [position]);

  return position ? (
    <Marker ref={ref} position={[position.lat, position.lng]} icon={driverIcon} />
  ) : null;
});

export default DriverMarker;
