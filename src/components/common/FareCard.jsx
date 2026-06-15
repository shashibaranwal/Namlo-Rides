import { FARE_PER_KM } from "../../config/constants";

export default function FareCard({ fare, distanceKm, label = "Fare", loading = false }) {
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{label}</span>
        <span className="text-lg font-bold text-blue-900">{fare != null ? `Rs ${fare}` : loading ? "…" : "—"}</span>
      </div>
      <p className="text-xs text-blue-600/70 mt-0.5">
        {distanceKm != null ? `${distanceKm.toFixed(2)} km · ` : loading ? "Calculating route · " : ""}
        Rs {FARE_PER_KM}/km
      </p>
    </div>
  );
}
