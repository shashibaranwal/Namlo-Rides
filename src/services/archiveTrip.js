import { TERMINAL } from "../state/rideMachine";
import { saveRideRecord } from "./historyAPI";
import { patchTrip } from "./realtime";

export async function archiveIfTerminal(trip) {
  if (!trip || !TERMINAL.has(trip.status) || trip.historyWritten) return;

  // claim the write first so the other window doesn't double-post
  await patchTrip(trip.id, { historyWritten: true });

  const record = {
    tripId: trip.id,
    riderName: trip.rider?.name ?? "Rider",
    driverName: trip.driver?.name ?? "—",
    pickup: trip.rider?.pickup,
    dropoff: trip.rider?.dropoff,
    distanceKm: trip.distanceKm ?? null,
    fare: trip.fare ?? null,
    status: trip.status,
    requestedAt: trip.createdAt,
    resolvedAt: Date.now(),
  };

  try {
    await saveRideRecord(record);
  } catch (e) {
    // backend failure mid-trip: roll back the flag so a retry can succeed
    await patchTrip(trip.id, { historyWritten: false });
    console.error("Archive failed, will retry on next observation", e);
  }
}