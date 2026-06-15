import { useEffect, useReducer } from "react";
import { rideReducer, S } from "./rideMachine";
import { subscribeTrip } from "../services/realtime";
import { archiveIfTerminal } from "../services/archiveTrip";

const INITIAL = { status: S.IDLE };

/**
 * Subscribes to one trip and mirrors its live Firebase state into a local
 * reducer. Every snapshot also runs archiveIfTerminal, so whichever window
 * observes the terminal state first fires the REST history write exactly once.
 * The returned unsubscribe is wired into cleanup to avoid listener leaks.
 */
export function useRide(tripId) {
  const [trip, dispatch] = useReducer(rideReducer, INITIAL);

  useEffect(() => {
    if (!tripId) {
      dispatch({ type: "RESET", initial: INITIAL });
      return;
    }

    const unsub = subscribeTrip(tripId, (snapshot) => {
      if (!snapshot) return;
      dispatch({ type: "SYNC", trip: snapshot });
      archiveIfTerminal(snapshot);
    });

    return () => unsub();
  }, [tripId]);

  return [trip, dispatch];
}
