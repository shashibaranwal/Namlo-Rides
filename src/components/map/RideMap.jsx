import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { KATHMANDU, DEFAULT_ZOOM } from "../../config/constants";

// Keep Leaflet's canvas in sync when the layout reflows (breakpoint changes,
// orientation flips) so tiles don't render half-grey on resize.
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);
  return null;
}

export default function RideMap({ children }) {
  return (
    <MapContainer
      center={[KATHMANDU.lat, KATHMANDU.lng]}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ResizeHandler />
      {children}
    </MapContainer>
  );
}
