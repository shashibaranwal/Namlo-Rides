export default function CompletionDialog({ fare, distanceKm, amountLabel, actionLabel, onClose }) {
  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
        {/* Green tick */}
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900">Ride successfully completed</h2>
        <p className="text-sm text-gray-500 mt-1">Thanks for using Namlo Rides.</p>

        <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 py-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">{amountLabel}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{fare != null ? `Rs ${fare}` : "—"}</p>
          {distanceKm != null && <p className="text-xs text-gray-400 mt-1">{distanceKm.toFixed(2)} km</p>}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold transition"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
