import { useDriverSimulation } from "../../hooks/useDriverSimulation";
import { useDisconnectGuard } from "../../hooks/useDisconnectGuard";
import { useRoute } from "../../hooks/useRoute";
import { S, TERMINAL } from "../../state/rideMachine";
import { startDriving, startTrip, cancelRide, arriveAtPickup, completeTrip } from "../../state/actions";
import StatusBadge from "../common/StatusBadge";
import FareCard from "../common/FareCard";
import RequestList from "./RequestList";

const fmt = (p) => (p ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : "—");

export default function DriverPanel({ tripId, trip, onAccept, onReject, onBackToRequests }) {
  const status = trip?.status;

  // Real road geometry for each leg — the dot follows these, not a straight line.
  const legToPickup = useRoute(trip?.driver?.startLocation, trip?.rider?.pickup);
  const legToDropoff = useRoute(trip?.rider?.pickup, trip?.rider?.dropoff);

  // Hooks run unconditionally; the `active` flag gates each leg internally.
  useDriverSimulation({
    tripId,
    active: status === S.EN_ROUTE,
    path: legToPickup?.path,
    onArrive: () => arriveAtPickup(trip),
  });
  useDriverSimulation({
    tripId,
    active: status === S.IN_PROGRESS,
    path: legToDropoff?.path,
    onArrive: () => completeTrip(trip),
  });
  useDisconnectGuard(tripId, status);

  const hasActive = tripId && status && status !== S.IDLE;
  if (!hasActive) {
    return <RequestList onAccept={onAccept} onReject={onReject} />;
  }

  const isTerminal = TERMINAL.has(status);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Active trip</h2>
        <StatusBadge status={status} />
      </div>

      <FareCard label="You earn" fare={trip.fare} distanceKm={trip.distanceKm} />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Rider</dt>
          <dd className="text-gray-900">{trip.rider?.name ?? "Rider"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Pickup</dt>
          <dd className="text-gray-900">{fmt(trip.rider?.pickup)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Dropoff</dt>
          <dd className="text-gray-900">{fmt(trip.rider?.dropoff)}</dd>
        </div>
      </dl>

      {/* Stage-driven controls */}
      {status === S.ACCEPTED && (
        <button
          type="button"
          onClick={() => startDriving(trip)}
          className="w-full py-2.5 rounded-lg bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold transition"
        >
          Start driving to pickup
        </button>
      )}

      {status === S.EN_ROUTE && (
        <p className="text-sm text-wine-700 bg-wine-50 rounded-lg px-3 py-2.5">Driving to pickup…</p>
      )}

      {status === S.ARRIVED && (
        <button
          type="button"
          onClick={() => startTrip(trip)}
          className="w-full py-2.5 rounded-lg bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold transition"
        >
          Start trip
        </button>
      )}

      {status === S.IN_PROGRESS && (
        <p className="text-sm text-wine-700 bg-wine-50 rounded-lg px-3 py-2.5">Trip in progress — heading to dropoff…</p>
      )}

      {isTerminal && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-gray-600">
            {status === S.COMPLETED && "Trip completed and logged to history."}
            {status === S.CANCELLED && "This trip was cancelled."}
            {status === S.REJECTED && "Request rejected."}
          </p>
          <button
            type="button"
            onClick={onBackToRequests}
            className="w-full py-2.5 rounded-lg bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold transition"
          >
            Back to requests
          </button>
        </div>
      )}

      {!isTerminal && (
        <button
          type="button"
          onClick={() => cancelRide(trip)}
          className="w-full py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
        >
          Cancel trip
        </button>
      )}
    </div>
  );
}
