import { canTransition, S } from "./rideMachine";
import { createTrip, patchTrip } from "../services/realtime";

// small random offset (~1-2km) so the driver has somewhere to drive from
function jitter(point, amount = 0.018) {
  return {
    lat: point.lat + (Math.random() - 0.5) * amount * 2,
    lng: point.lng + (Math.random() - 0.5) * amount * 2,
  };
}

/**
 * The single choke-point for every status write. The Firebase trip is the
 * source of truth, so we validate the transition against the state machine
 * BEFORE persisting — illegal jumps (e.g. COMPLETED → EN_ROUTE) never hit the
 * wire, which keeps every subscribed window consistent.
 */
export function guardedTransition(trip, status, patch = {}) {
  if (!trip?.id) return Promise.resolve(false);
  if (!canTransition(trip.status, status)) {
    console.warn(`Blocked illegal transition: ${trip.status} → ${status}`);
    return Promise.resolve(false);
  }
  return patchTrip(trip.id, { status, ...patch }).then(() => true);
}

// --- Rider actions ---------------------------------------------------------
export function requestRide({ rider, fare = null, distanceKm = null }) {
  return createTrip({ status: S.REQUESTING, rider, fare, distanceKm, createdAt: Date.now() });
}

export const cancelRide = (trip) => guardedTransition(trip, S.CANCELLED);

// --- Driver actions --------------------------------------------------------
export function acceptRide(trip, driverName) {
  return guardedTransition(trip, S.ACCEPTED, {
    driver: { name: driverName, startLocation: jitter(trip.rider.pickup) },
  });
}

export const rejectRide = (trip) => guardedTransition(trip, S.REJECTED);
export const startDriving = (trip) => guardedTransition(trip, S.EN_ROUTE);
export const startTrip = (trip) => guardedTransition(trip, S.IN_PROGRESS);
export const arriveAtPickup = (trip) => guardedTransition(trip, S.ARRIVED);
export const completeTrip = (trip) => guardedTransition(trip, S.COMPLETED);
