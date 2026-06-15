import { useOpenRequests } from "../../hooks/useOpenRequests";
import PlaceLabel from "../common/PlaceLabel";

export default function RequestList({ onAccept, onReject }) {
  const requests = useOpenRequests();

  if (requests.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <p className="text-sm text-gray-500">Waiting for ride requests…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-900">
        Open requests <span className="text-gray-400">({requests.length})</span>
      </h2>

      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{r.rider?.name ?? "Rider"}</p>
              <span className="text-sm font-bold text-wine-700">{r.fare != null ? `Rs ${r.fare}` : "—"}</span>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>
                <span className="text-green-600 font-medium">Pickup</span> <PlaceLabel point={r.rider?.pickup} />
              </p>
              <p>
                <span className="text-red-600 font-medium">Dropoff</span> <PlaceLabel point={r.rider?.dropoff} />
              </p>
              {r.distanceKm != null && <p className="text-gray-400">{r.distanceKm.toFixed(2)} km</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onAccept(r)}
                className="flex-1 py-1.5 rounded-md bg-wine-600 hover:bg-wine-700 text-white text-xs font-semibold transition"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onReject(r)}
                className="flex-1 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
