# Namlo Rides 🚕

A **web-only, real-time ride-sharing simulator** built with React. A single running instance lets an evaluator play **both sides** of a trip, Rider and Driver, in two browser windows side by side, with live position streaming, a real road-following route, fare calculation, and persistent ride history.

The app deliberately uses **no custom backend**. State is distributed through a hybrid client architecture:

- **Firebase Realtime Database** for high-frequency live telemetry (trip status + per-second driver position).
- A **mock REST API** for durable, transactional ride-history records.
- The free, keyless **OSRM** routing API for real road geometry.

---

## Table of contents

- [Test credentials](#test-credentials)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Running the dual-role simulation](#running-the-dual-role-simulation)
- [Architecture](#architecture)
  - [Hybrid data architecture](#1-hybrid-data-architecture)
  - [State machine](#2-state-machine)
  - [The trip data model](#3-the-trip-data-model)
  - [Rendering optimization](#4-rendering-optimization)
  - [Lifecycle & cleanup](#5-lifecycle--cleanup)
- [Ride lifecycle / workflow](#ride-lifecycle--workflow)
- [Folder structure](#folder-structure)
- [External services](#external-services)
- [Deployment](#deployment)
- [Design notes](#design-notes)

---

## Test credentials

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `intern@namlotech.com` |
| Password | `namlo2026`            |

These are hardcoded in [`src/config/constants.js`](src/config/constants.js).

---

## Features

- 🔐 **Authenticated routing** — login screen guards the app; protected routes redirect to `/login`.
- 🧑‍🤝‍🧑 **Dual-role simulation** — switch between **Rider** and **Driver** in any window; the two sides sync through Firebase in real time.
- 🗺️ **Leaflet map** centred on Kathmandu; click to drop pickup / dropoff pins.
- 🛣️ **Real road routing** — the driver follows the actual street network (OSRM), not a straight line, at a constant speed.
- 💸 **Fare engine** — `Rs 20/km` based on real road distance, shown as a live estimate, the driver's earnings, and the rider's total.
- 🧾 **Persistent history** — every terminal trip (completed / cancelled / rejected) is written to a REST API and rendered in a History view.
- ✅ **Completion dialog** — a success modal with the total fare when a ride finishes.
- 🎨 **Creamy-white + wine-red theme**, fully responsive (mobile → desktop).

---

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| UI             | React 19                                           |
| Build tool     | Vite 8                                             |
| Routing        | React Router 7                                     |
| Styling        | Tailwind CSS 4 (CSS-first `@theme` tokens)         |
| Realtime sync  | Firebase Realtime Database (`firebase` SDK)        |
| Maps           | Leaflet + React-Leaflet                            |
| Road routing   | OSRM public demo API                               |
| History store  | Any mock REST service (MockAPI.io, Beeceptor, …)   |
| Linting        | ESLint 10 (`react-hooks`, `react-refresh` plugins) |

---

## Quick start

### Prerequisites

- **Node.js** — a recent LTS (Vite 8 needs Node `20.19+` or `22.12+`)
- **npm** (ships with Node)
- A **Firebase** project with Realtime Database enabled
- A **mock REST endpoint** exposing a `/rides` collection (GET + POST)

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Create your .env (see the next section) in the project root

# 3. Start the dev server
npm run dev
```

Vite prints a local URL (default `http://localhost:5173`). Open it, sign in with the test credentials, and you're in.

---

## Environment variables

Create a **`.env`** file in the project root. All keys are exposed to the client via Vite's `import.meta.env`, so they **must** be prefixed with `VITE_`.

```ini
# --- Firebase Realtime Database ---
VITE_FB_API_KEY=your_api_key
VITE_FB_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FB_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FB_PROJECT_ID=your_project_id
VITE_FB_STORAGE_BUCKET=your_project.appspot.com
VITE_FB_MESSAGING_SENDER_ID=000000000000
VITE_FB_APP_ID=1:000000000000:web:xxxxxxxxxxxx

# --- Mock REST history API (base URL, no trailing slash) ---
# The app calls `${VITE_HISTORY_API}/rides`
VITE_HISTORY_API=https://your-mock-id.mockapi.io/api/v1
```

| Variable                      | Used by                          | Purpose                                    |
| ----------------------------- | -------------------------------- | ------------------------------------------ |
| `VITE_FB_*`                   | `src/services/firebase.js`       | Firebase app / Realtime Database init      |
| `VITE_HISTORY_API`            | `src/services/historyAPI.js`     | Base URL for the `/rides` history endpoint |

> **Firebase rules:** for the demo, set the Realtime Database rules to allow read/write (test mode). **Mock REST:** the collection must accept `GET /rides` and `POST /rides`.

---

## Available scripts

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR            |
| `npm run build`   | Production build into `dist/`                 |
| `npm run preview` | Serve the production build locally            |
| `npm run lint`    | Run ESLint over the project                   |

---

## Running the dual-role simulation

The challenge is best observed with **two windows side by side**:

1. Open the app in **Window A**, sign in, and leave it on **Rider**.
2. Open the app in **Window B** (same URL), sign in, and switch it to **Driver**.
3. **Rider (A):** tap *Pickup*, click the map; tap *Dropoff*, click the map → an estimated fare appears → **Request ride**.
4. **Driver (B):** the request appears in the list **with its fare** → **Accept** → **Start driving to pickup** (watch the gold dot follow the streets) → **Start trip** → it auto-completes at the dropoff.
5. Both windows show a **"Ride successfully completed"** dialog with the total fare.
6. Open **History** (header link) to see the persisted record.

> Role and the active trip id are stored per-window in `sessionStorage`, so a refresh keeps each window's context.

---

## Architecture

The design is organised around the four things the challenge evaluates.

### 1. Hybrid data architecture

Responsibilities are split by data *shape*, not lumped together:

```
                    ┌─────────────────────────────┐
   high-frequency   │   Firebase Realtime DB       │   live, transient
   (≈1 write/sec) ──▶   trips/{id}                 │   (status + driverLocation)
                    └─────────────────────────────┘
                                  │  onValue stream (SYNC)
                                  ▼
                    ┌─────────────────────────────┐
                    │   React (useRide reducer)    │
                    └─────────────────────────────┘
                                  │  on terminal state (once)
                                  ▼
                    ┌─────────────────────────────┐
   transactional    │   Mock REST API  /rides      │   durable archive
   (1 write/trip) ──▶   POST record, GET history   │
                    └─────────────────────────────┘
```

- **Live channel** — `src/services/realtime.js` streams trip changes and the per-second driver position over Firebase.
- **Archive channel** — `src/services/archiveTrip.js` fires **exactly one** REST `POST` when a trip reaches a terminal state. It "claims" the write first by flipping a `historyWritten` flag in Firebase, so two open windows never double-post; on REST failure it rolls the flag back so a later snapshot retries.

### 2. State machine

A trip's status is governed by an explicit machine in [`src/state/rideMachine.js`](src/state/rideMachine.js). Illegal transitions are **rejected at the write boundary** (`guardedTransition` in [`src/state/actions.js`](src/state/actions.js)) *before* they ever hit Firebase, keeping every subscribed window consistent.

```
IDLE → REQUESTING → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
            │           │          │          │           │
            ├─ REJECTED └──────────┴──────────┴───────────┴─→ CANCELLED
            └─ CANCELLED
```

`COMPLETED`, `CANCELLED`, and `REJECTED` are terminal. Cancellation is reachable from every active state, so a mid-trip disruption is always handled.

### 3. The trip data model

A single `trips/{id}` node in Firebase:

```jsonc
{
  "id": "-Nxyz…",
  "status": "IN_PROGRESS",
  "createdAt": 1718440000000,
  "updatedAt": 1718440042000,
  "fare": 69,                       // NPR, frozen at request time
  "distanceKm": 3.42,               // road distance from OSRM
  "rider":  { "name": "Rider",  "pickup": { "lat": 27.71, "lng": 85.32 },
                                  "dropoff": { "lat": 27.70, "lng": 85.33 } },
  "driver": { "name": "Driver", "startLocation": { "lat": 27.72, "lng": 85.30 } },
  "driverLocation": { "lat": 27.715, "lng": 85.318, "ts": 1718440042000 }, // hot path
  "historyWritten": false           // idempotency claim for the REST archive
}
```

The persisted **history record** (sent to `/rides`) is a flattened snapshot: `tripId, riderName, driverName, pickup, dropoff, distanceKm, fare, status, requestedAt, resolvedAt`.

### 4. Rendering optimization

The live stream emits a state change **every second**, so the map is built to avoid redundant work:

- The **driver marker** updates its position **imperatively** via Leaflet's `setLatLng` and is `memo`-ised, so the dot moves without React re-rendering the marker tree.
- **Route lines** and **pickup/dropoff markers** are `memo`-ised on a reference / lat-lng check, so the per-second driver updates don't redraw static layers.
- **Routes are cached** (`src/services/routing.js`) and keyed on primitive coordinates (`useRoute`), so snapshot churn never triggers a refetch.
- The driver simulation advances by **distance, not array index**, keeping a constant speed regardless of how densely the road geometry is sampled, and keeps its `onArrive` callback in a ref so the animation interval is never torn down mid-leg.

### 5. Lifecycle & cleanup

Every listener, interval, and disconnect handler is unwound:

- `useRide`, `useOpenRequests` → return Firebase's unsubscribe from their effects.
- `useDriverSimulation` → `clearInterval` on unmount / leg change.
- `useDisconnectGuard` → arms a Firebase `onDisconnect` while a trip is live (auto-cancelling dropped trips) and **cancels** it on a clean terminal state.
- `RideMap` → removes its window `resize` listener on unmount.
- `HistoryView` → an abort flag prevents `setState` after unmount.

---

## Ride lifecycle / workflow

```
Rider                         Firebase (trips/{id})                  Driver
─────                         ─────────────────────                  ──────
pick pickup + dropoff
estimate fare (OSRM)
Request ─────────────────────▶ REQUESTING ───────────────────────▶ appears in list (w/ fare)
                                                                    Accept
            ACCEPTED ◀──────── driver + startLocation ◀──────────── (sets driver)
                                                                    Start driving
            EN_ROUTE  ◀─────── driverLocation stream ◀───────────── simulate start→pickup (roads)
            ARRIVED   ◀─────── (auto on reaching pickup) ──────────
                                                                    Start trip
            IN_PROGRESS ◀───── driverLocation stream ◀───────────── simulate pickup→dropoff (roads)
            COMPLETED ◀─────── (auto on reaching dropoff) ─────────
   │                                                                       │
   └── success dialog: "Total paid"     ──▶ POST /rides ◀──   success dialog: "Total received"
```

---

## Folder structure

```
namlo-rides/
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ common/
│  │  │  ├─ CompletionDialog.jsx   # success modal with green tick + total fare
│  │  │  ├─ FareCard.jsx           # fare + distance + Rs/km rate display
│  │  │  ├─ RoleSwitcher.jsx       # Rider ⇄ Driver toggle
│  │  │  └─ StatusBadge.jsx        # coloured pill per trip status
│  │  ├─ driver/
│  │  │  ├─ DriverPanel.jsx        # driver controls + runs the road simulation
│  │  │  └─ RequestList.jsx        # live open requests (with fare) to accept/reject
│  │  ├─ history/
│  │  │  └─ HistoryView.jsx        # /history page — fetches & renders the REST archive
│  │  ├─ map/
│  │  │  ├─ DriverMarker.jsx       # memo'd, imperative live driver dot
│  │  │  ├─ MapClickHandler.jsx    # captures map clicks for pin-dropping
│  │  │  ├─ PointMarker.jsx        # memo'd static pickup/dropoff marker
│  │  │  ├─ RideMap.jsx            # MapContainer + tiles + resize handling
│  │  │  ├─ RouteLine.jsx          # memo'd road polyline
│  │  │  └─ markers.js             # div-icon definitions (no image 404s)
│  │  └─ rider/
│  │     └─ RiderPanel.jsx         # pin picker, fare estimate, ride status
│  ├─ config/
│  │  └─ constants.js              # credentials, Kathmandu centre, fare/km, tick rate
│  ├─ context/
│  │  └─ AuthContext.jsx           # sessionStorage-backed auth provider + useAuth
│  ├─ hooks/
│  │  ├─ useDisconnectGuard.js     # arm/cancel Firebase onDisconnect
│  │  ├─ useDriverSimulation.js    # animate the driver along a road path
│  │  ├─ useOpenRequests.js        # live list of REQUESTING trips
│  │  └─ useRoute.js               # resolve + cache a road route between 2 points
│  ├─ pages/
│  │  ├─ LoginPage.jsx             # email/password sign-in
│  │  └─ SimulatorPage.jsx         # main orchestrator: map + role panel + dialog
│  ├─ routes/
│  │  └─ ProtectedRoute.jsx        # redirects unauthenticated users to /login
│  ├─ services/
│  │  ├─ archiveTrip.js            # idempotent REST write on terminal state
│  │  ├─ firebase.js               # Firebase app + Realtime DB init
│  │  ├─ historyAPI.js             # GET/POST /rides
│  │  ├─ realtime.js               # all Firebase trip reads/writes + subscriptions
│  │  └─ routing.js                # OSRM road routing + cache + straight-line fallback
│  ├─ state/
│  │  ├─ actions.js                # transition-guarded trip actions
│  │  ├─ rideMachine.js            # states, allowed transitions, reducer
│  │  └─ useRide.js                # subscribe to a trip → reducer + archive
│  ├─ utils/
│  │  └─ geo.js                    # haversine distance helpers
│  ├─ App.jsx                      # router + providers
│  ├─ main.jsx                     # React entry point
│  └─ index.css                    # Tailwind import + theme tokens
├─ .env                            # your secrets (not committed)
├─ index.html
├─ package.json
└─ vite.config.js
```

### Routes

| Path       | Access    | Component       |
| ---------- | --------- | --------------- |
| `/login`   | public    | `LoginPage`     |
| `/`        | protected | `SimulatorPage` |
| `/history` | protected | `HistoryView`   |

---

## External services

| Service                  | Role                                          | Notes                                              |
| ------------------------ | --------------------------------------------- | -------------------------------------------------- |
| Firebase Realtime DB     | Live trip status + driver position streaming  | Requires the `VITE_FB_*` config; test-mode rules   |
| OSRM (`router.project-osrm.org`) | Driving route geometry + distance     | Free, keyless public demo; straight-line fallback if unreachable |
| Mock REST (`/rides`)     | Persistent ride-history records               | Set `VITE_HISTORY_API`; needs GET + POST           |

---

## Deployment

The app is a static SPA — deploy the `dist/` build to Vercel, Netlify, or GitHub Pages.

```bash
npm run build      # outputs dist/
npm run preview    # sanity-check the build locally
```

Checklist for a working live link:

- Set the `VITE_*` environment variables in your host's dashboard (they're inlined at build time).
- Ensure the Firebase database rules and the mock REST endpoint are publicly readable/writable for the demo.
- Add an SPA fallback so client-side routes (`/history`) resolve — e.g. Netlify `_redirects` `/* /index.html 200`, or Vercel's framework preset.

---

## Design notes

- **Theme** — defined once as Tailwind v4 `@theme` tokens in [`src/index.css`](src/index.css): a `cream` surface ramp and a `wine` accent ramp, usable as `bg-/text-/border-/ring-{cream,wine}-*`.
- **Responsiveness** — the simulator stacks the map above the panel on mobile and sits side-by-side on `md+`; the history table sheds columns on small screens; the map calls Leaflet's `invalidateSize()` on resize.
- **Map markers** use CSS `divIcon`s (no bundled image assets), so there are no broken-marker `404`s; the live driver dot is gold to stay visible over the wine route lines.

---

_Namlo Technologies Pvt. Ltd. — Frontend Engineering Challenge_
