import L from "leaflet";

// Pure CSS/div icons — avoids the classic Leaflet "marker image 404" problem
// with bundlers entirely, and keeps pickup / dropoff / driver visually distinct.
function pin(color, glyph) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:26px;height:26px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;font-family:sans-serif;">${glyph}</span>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

export const pickupIcon = pin("#16a34a", "P");
export const dropoffIcon = pin("#dc2626", "D");

export const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    background:#2563eb;
    width:22px;height:22px;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 0 0 2px rgba(37,99,235,.4),0 2px 6px rgba(0,0,0,.35);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});
