import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { KATHMANDU, DEFAULT_ZOOM } from "../../config/constants";

// declare center/zoom OUTSIDE render so identity is stable
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
      {children}
    </MapContainer>
  );
}