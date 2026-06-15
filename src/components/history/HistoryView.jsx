import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRideHistory } from "../../services/historyAPI";
import StatusBadge from "../common/StatusBadge";
import PlaceLabel from "../common/PlaceLabel";

const fmtTime = (ts) => (ts ? new Date(ts).toLocaleString() : "—");

export default function HistoryView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State is only updated in the async callbacks, never synchronously in the
  // effect body — so the mount fetch doesn't trigger a cascading render.
  const load = useCallback((signal) => {
    return fetchRideHistory()
      .then((data) => {
        if (signal?.aborted) return;
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
        setRows(list);
        setError("");
      })
      .catch((e) => !signal?.aborted && setError(e.message))
      .finally(() => !signal?.aborted && setLoading(false));
  }, []);

  // Fetch once on mount; abort flag prevents setState after unmount.
  useEffect(() => {
    const controller = { aborted: false };
    load(controller);
    return () => {
      controller.aborted = true;
    };
  }, [load]);

  const refresh = () => {
    setLoading(true);
    setError("");
    load();
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-white border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-wine-700 hover:text-wine-900">← Back</Link>
            <h1 className="text-lg font-bold text-wine-900">Ride History</h1>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="text-sm font-medium text-wine-700 hover:text-wine-900"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading && <p className="text-sm text-gray-500">Loading history…</p>}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Couldn't load history: {error}
          </p>
        )}

        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-gray-500">No rides recorded yet.</p>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto bg-white border border-cream-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-cream-200">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Rider</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Pickup</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Dropoff</th>
                  <th className="px-4 py-3 font-medium">Fare</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id ?? r.tripId} className="border-b border-cream-100 last:border-0">
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-900">{r.riderName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-900">{r.driverName ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell"><PlaceLabel point={r.pickup} /></td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell"><PlaceLabel point={r.dropoff} /></td>
                    <td className="px-4 py-3 text-gray-900">
                      {r.fare != null ? `Rs ${r.fare}` : "—"}
                      {r.distanceKm != null && <span className="text-gray-400"> · {r.distanceKm.toFixed(1)} km</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{fmtTime(r.resolvedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
