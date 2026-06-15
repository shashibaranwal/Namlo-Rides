import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRide } from "../state/useRide";
import { requestRide, cancelRide, acceptRide, rejectRide } from "../state/actions";
import RoleSwitcher from "../components/common/RoleSwitcher";
import RideMap from "../components/map/RideMap";
import MapClickHandler from "../components/map/MapClickHandler";
import PointMarker from "../components/map/PointMarker";
import RouteLine from "../components/map/RouteLine";
import DriverMarker from "../components/map/DriverMarker";
import { pickupIcon, dropoffIcon } from "../components/map/markers";
import RiderPanel from "../components/rider/RiderPanel";
import DriverPanel from "../components/driver/DriverPanel";

export default function SimulatorPage() {
  const { logout } = useAuth();

  // Role + the active trip id for each role, persisted so a refresh (or a
  // viewport that picks a role) survives. Two windows of the same app — one
  // Rider, one Driver — sync entirely through Firebase.
  const [role, setRole] = useState(() => sessionStorage.getItem("namlo_role") || "rider");
  const [riderTripId, setRiderTripId] = useState(() => sessionStorage.getItem("namlo_trip_rider") || null);
  const [driverTripId, setDriverTripId] = useState(() => sessionStorage.getItem("namlo_trip_driver") || null);

  useEffect(() => sessionStorage.setItem("namlo_role", role), [role]);
  useEffect(() => {
    riderTripId ? sessionStorage.setItem("namlo_trip_rider", riderTripId) : sessionStorage.removeItem("namlo_trip_rider");
  }, [riderTripId]);
  useEffect(() => {
    driverTripId ? sessionStorage.setItem("namlo_trip_driver", driverTripId) : sessionStorage.removeItem("namlo_trip_driver");
  }, [driverTripId]);

  // Rider's pin-picking draft (before a ride exists).
  const [draftPickup, setDraftPickup] = useState(null);
  const [draftDropoff, setDraftDropoff] = useState(null);
  const [picking, setPicking] = useState("pickup");

  const activeTripId = role === "rider" ? riderTripId : driverTripId;
  const [trip] = useRide(activeTripId);

  const riderDrafting = role === "rider" && !riderTripId;

  const handleMapPick = useCallback(
    (latlng) => {
      if (picking === "pickup") {
        setDraftPickup(latlng);
        setPicking("dropoff");
      } else {
        setDraftDropoff(latlng);
      }
    },
    [picking]
  );

  const handleRequest = useCallback(() => {
    if (!draftPickup || !draftDropoff) return;
    requestRide({ name: "Rider", pickup: draftPickup, dropoff: draftDropoff }).then(setRiderTripId);
  }, [draftPickup, draftDropoff]);

  const handleResetRider = useCallback(() => {
    setRiderTripId(null);
    setDraftPickup(null);
    setDraftDropoff(null);
    setPicking("pickup");
  }, []);

  const handleAccept = useCallback((r) => {
    acceptRide(r, "Driver").then((ok) => ok && setDriverTripId(r.id));
  }, []);

  // Points shown on the shared map: from the live trip, or the rider's draft.
  const pickupPoint = trip?.rider?.pickup ?? (riderDrafting ? draftPickup : null);
  const dropoffPoint = trip?.rider?.dropoff ?? (riderDrafting ? draftDropoff : null);
  const driverPos = trip?.driverLocation ?? null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">N</span>
            <h1 className="text-base font-bold text-gray-900">Namlo Rides</h1>
          </div>

          <RoleSwitcher role={role} onChange={setRole} />

          <div className="flex items-center gap-4">
            <Link to="/history" className="text-sm font-medium text-gray-600 hover:text-gray-900">History</Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Body: map + panel */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-h-0">
          <RideMap>
            {riderDrafting && <MapClickHandler onPick={handleMapPick} />}
            <PointMarker position={pickupPoint} icon={pickupIcon} />
            <PointMarker position={dropoffPoint} icon={dropoffIcon} />
            <RouteLine from={pickupPoint} to={dropoffPoint} />
            <DriverMarker position={driverPos} />
          </RideMap>

          {riderDrafting && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-200 text-xs text-gray-600">
              Click the map to set your <span className="font-semibold">{picking}</span>
            </div>
          )}
        </div>

        <aside className="w-96 shrink-0 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          {role === "rider" ? (
            <RiderPanel
              trip={trip}
              hasTrip={!!riderTripId}
              draft={{ pickup: draftPickup, dropoff: draftDropoff }}
              picking={picking}
              setPicking={setPicking}
              onRequest={handleRequest}
              onCancel={() => cancelRide(trip)}
              onReset={handleResetRider}
            />
          ) : (
            <DriverPanel
              tripId={driverTripId}
              trip={trip}
              onAccept={handleAccept}
              onReject={rejectRide}
              onBackToRequests={() => setDriverTripId(null)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
