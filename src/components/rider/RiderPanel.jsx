import { S, TERMINAL } from "../../state/rideMachine";
import StatusBadge from "../common/StatusBadge";
import FareCard from "../common/FareCard";

const fmt = (p) => (p ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "Click map to set");

function PointRow({ active, color, label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition ${
        active ? "border-wine-500 ring-2 ring-wine-100 bg-wine-50/60" : "border-cream-200 hover:border-cream-300"
      }`}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="flex-1">
        <span className="block text-xs font-medium text-gray-500">{label}</span>
        <span className="block text-sm text-gray-900">{value}</span>
      </span>
    </button>
  );
}

export default function RiderPanel({ trip, hasTrip, draft, picking, setPicking, onRequest, onCancel, onReset, distanceKm, fare }) {
  const status = trip?.status;
  const isTerminal = TERMINAL.has(status);
  const isActive = hasTrip && !isTerminal && status !== S.IDLE;

  // ---- Live trip in progress ----------------------------------------------
  if (isActive) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Your ride</h2>
          <StatusBadge status={status} />
        </div>

        <FareCard label="Fare" fare={trip.fare} distanceKm={trip.distanceKm} />

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Pickup</dt>
            <dd className="text-gray-900">{fmt(trip.rider?.pickup)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Dropoff</dt>
            <dd className="text-gray-900">{fmt(trip.rider?.dropoff)}</dd>
          </div>
          {trip.driver?.name && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Driver</dt>
              <dd className="text-gray-900">{trip.driver.name}</dd>
            </div>
          )}
        </dl>

        <p className="text-sm text-gray-500">
          {status === S.REQUESTING && "Looking for a nearby driver…"}
          {status === S.ACCEPTED && "A driver accepted your ride."}
          {status === S.EN_ROUTE && "Your driver is on the way to pickup."}
          {status === S.ARRIVED && "Your driver has arrived at pickup."}
          {status === S.IN_PROGRESS && "Enjoy your ride — heading to your destination."}
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
        >
          Cancel ride
        </button>
      </div>
    );
  }

  // ---- Resolved trip ------------------------------------------------------
  if (hasTrip && isTerminal) {
    return (
      <div className="space-y-5 text-center">
        <StatusBadge status={status} />
        {status === S.COMPLETED && <FareCard label="Total paid" fare={trip.fare} distanceKm={trip.distanceKm} />}
        <p className="text-sm text-gray-600">
          {status === S.COMPLETED && "You've reached your destination. Thanks for riding!"}
          {status === S.CANCELLED && "This ride was cancelled."}
          {status === S.REJECTED && "No driver accepted this ride."}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 rounded-lg bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold transition"
        >
          Request another ride
        </button>
      </div>
    );
  }

  // ---- Request builder ----------------------------------------------------
  const ready = draft.pickup && draft.dropoff;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Request a ride</h2>
        <p className="text-xs text-gray-500 mt-1">Tap a field, then click the map to drop the pin.</p>
      </div>

      <div className="space-y-2">
        <PointRow
          active={picking === "pickup"}
          color="#15803d"
          label="Pickup"
          value={fmt(draft.pickup)}
          onClick={() => setPicking("pickup")}
        />
        <PointRow
          active={picking === "dropoff"}
          color="#b91c1c"
          label="Dropoff"
          value={fmt(draft.dropoff)}
          onClick={() => setPicking("dropoff")}
        />
      </div>

      {ready && <FareCard label="Estimated fare" fare={fare} distanceKm={distanceKm} loading={fare == null} />}

      <button
        type="button"
        disabled={!ready}
        onClick={onRequest}
        className="w-full py-2.5 rounded-lg bg-wine-600 hover:bg-wine-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
      >
        Request ride
      </button>
    </div>
  );
}
