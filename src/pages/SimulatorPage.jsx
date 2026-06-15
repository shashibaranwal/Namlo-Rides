import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRide } from "../state/useRide";
import { useRoute } from "../hooks/useRoute";
import { requestRide, cancelRide, acceptRide, rejectRide } from "../state/actions";
import { S } from "../state/rideMachine";
import { FARE_PER_KM } from "../config/constants";
import RoleSwitcher from "../components/common/RoleSwitcher";
import RideMap from "../components/map/RideMap";
import MapClickHandler from "../components/map/MapClickHandler";
import PointMarker from "../components/map/PointMarker";
import RouteLine from "../components/map/RouteLine";
import DriverMarker from "../components/map/DriverMarker";
import { pickupIcon, dropoffIcon } from "../components/map/markers";
import RiderPanel from "../components/rider/RiderPanel";
import DriverPanel from "../components/driver/DriverPanel";
import CompletionDialog from "../components/common/CompletionDialog";

const fareFor = (km) => (km != null ? Math.round(km * FARE_PER_KM) : null);

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
  const status = trip?.status;

  const riderDrafting = role === "rider" && !riderTripId;

  // Points shown on the shared map: from the live trip, or the rider's draft.
  const pickupPoint = trip?.rider?.pickup ?? (riderDrafting ? draftPickup : null);
  const dropoffPoint = trip?.rider?.dropoff ?? (riderDrafting ? draftDropoff : null);
  const driverPos = trip?.driverLocation ?? null;

  // Road geometry: the trip route (pickup→dropoff) always, plus the driver's
  // approach leg (start→pickup) while heading to pickup.
  const tripRoute = useRoute(pickupPoint, dropoffPoint);
  const showApproach = status === S.ACCEPTED || status === S.EN_ROUTE;
  const approachRoute = useRoute(
    showApproach ? trip?.driver?.startLocation : null,
    showApproach ? pickupPoint : null
  );

  // Fare: prefer the value frozen onto the trip at request time; otherwise the
  // live estimate from the freshly-drawn draft route.
  const estDistanceKm = tripRoute?.distanceKm ?? null;
  const displayDistanceKm = trip?.distanceKm ?? estDistanceKm;
  const displayFare = trip?.fare ?? fareFor(estDistanceKm);

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
    const km = tripRoute?.distanceKm ?? null;
    requestRide({
      rider: { name: "Rider", pickup: draftPickup, dropoff: draftDropoff },
      distanceKm: km,
      fare: fareFor(km),
    }).then(setRiderTripId);
  }, [draftPickup, draftDropoff, tripRoute]);

  const handleResetRider = useCallback(() => {
    setRiderTripId(null);
    setDraftPickup(null);
    setDraftDropoff(null);
    setPicking("pickup");
  }, []);

  const handleAccept = useCallback((r) => {
    acceptRide(r, "Driver").then((ok) => ok && setDriverTripId(r.id));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-cream-100">
      {/* Header */}
      <header className="bg-white border-b border-cream-200 shrink-0">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-wine-600 text-white font-bold text-sm">N</span>
            <h1 className="text-base font-bold text-wine-900">Namlo Rides</h1>
          </div>

          <div className="order-last w-full flex justify-center sm:order-0 sm:w-auto">
            <RoleSwitcher role={role} onChange={setRole} />
          </div>

          <div className="flex items-center gap-4">
            <Link to="/history" className="text-sm font-medium text-wine-700 hover:text-wine-900">History</Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-wine-700 hover:text-wine-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Body: map + panel — stacked on mobile, side-by-side on md+ */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="relative h-[45vh] md:h-auto md:flex-1 min-h-0">
          <RideMap>
            {riderDrafting && <MapClickHandler onPick={handleMapPick} />}
            <PointMarker position={pickupPoint} icon={pickupIcon} />
            <PointMarker position={dropoffPoint} icon={dropoffIcon} />
            <RouteLine positions={tripRoute?.path} />
            {approachRoute && <RouteLine positions={approachRoute.path} color="#c25f6e" />}
            <DriverMarker position={driverPos} />
          </RideMap>

          {riderDrafting && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-cream-200 text-xs text-gray-600">
              Click the map to set your <span className="font-semibold text-wine-700">{picking}</span>
            </div>
          )}
        </div>

        <aside className="w-full md:w-96 flex-1 md:flex-none shrink-0 bg-white border-t md:border-t-0 md:border-l border-cream-200 p-5 sm:p-6 overflow-y-auto">
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
              distanceKm={displayDistanceKm}
              fare={displayFare}
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

      {status === S.COMPLETED && (
        <CompletionDialog
          fare={displayFare}
          distanceKm={displayDistanceKm}
          amountLabel={role === "rider" ? "Total paid" : "Total received"}
          actionLabel={role === "rider" ? "Request another ride" : "Back to requests"}
          onClose={role === "rider" ? handleResetRider : () => setDriverTripId(null)}
        />
      )}
    </div>
  );
}
