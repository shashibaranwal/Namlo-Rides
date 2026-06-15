import { useEffect } from "react";
import { guardDisconnect, cancelDisconnectGuard } from "../services/realtime";
import { TERMINAL } from "../state/rideMachine";

/**
 * Arms a Firebase onDisconnect handler while a trip is live, so if this client
 * drops mid-ride the trip is auto-cancelled instead of hanging forever. Once
 * the trip reaches a terminal state the guard is released so a clean close
 * doesn't retroactively cancel a finished ride.
 */
export function useDisconnectGuard(tripId, status) {
  useEffect(() => {
    if (!tripId || !status) return;

    if (TERMINAL.has(status)) {
      cancelDisconnectGuard(tripId);
      return;
    }

    guardDisconnect(tripId);
  }, [tripId, status]);
}
