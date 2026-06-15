import { useMapEvents } from "react-leaflet";

// Lets the rider drop pickup / dropoff pins by clicking the map.
export default function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
