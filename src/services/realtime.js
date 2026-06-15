import { db } from "./firebase";
import { ref, set, update, onValue, push, onDisconnect } from "firebase/database";

const tripRef = (id) => ref(db, `trips/${id}`);

export function createTrip(trip) {
  const id = push(ref(db, "trips")).key;
  return set(tripRef(id), { ...trip, id }).then(() => id);
}

export function patchTrip(id, patch) {
  return update(tripRef(id), { ...patch, updatedAt: Date.now() });
}

// high-frequency write: driver position (~1/sec)
export function pushDriverLocation(id, lat, lng) {
  return update(tripRef(id), { driverLocation: { lat, lng, ts: Date.now() } });
}

// subscribe to a single trip; RETURNS the unsubscribe fn
export function subscribeTrip(id, cb) {
  return onValue(tripRef(id), (snap) => cb(snap.val()));
}

// drivers watch all open requests; RETURNS unsubscribe
export function subscribeOpenRequests(cb) {
  return onValue(ref(db, "trips"), (snap) => {
    const all = snap.val() || {};
    cb(Object.values(all).filter((t) => t.status === "REQUESTING"));
  });
}

// auto-cancel if a client drops mid-trip
export function guardDisconnect(id) {
  return onDisconnect(tripRef(id)).update({ status: "CANCELLED", droppedAt: Date.now() });
}

export function cancelDisconnectGuard(id) {
  return onDisconnect(tripRef(id)).cancel();
}