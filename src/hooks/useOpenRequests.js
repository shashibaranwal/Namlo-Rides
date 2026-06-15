import { useEffect, useState } from "react";
import { subscribeOpenRequests } from "../services/realtime";

// Live list of trips still in REQUESTING — what a driver picks from.
export function useOpenRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const unsub = subscribeOpenRequests(setRequests);
    return () => unsub();
  }, []);

  return requests;
}
