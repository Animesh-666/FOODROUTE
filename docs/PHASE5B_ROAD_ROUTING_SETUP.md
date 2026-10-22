# FOODROUTE 2.0 — Phase 5B: Road-Network Route Planner (Development Sandbox)

**Version:** 0.6.0  
**Previous milestone:** Phase 5A verified locally (Firestore tests, production frontend build, rider dashboard online)  
**Goal:** Compare small directed road-time matrices, academic TSP algorithms, and a limited multi-rider stop assignment without touching live order dispatch.

## What is included

- `/admin/route-planner`: an admin-only, premium ivory/orange interactive planner screen.
- Up to **8 manually entered, sample stops**: one shared kitchen/depot and up to seven independent deliveries, with validation that all points are within 30 km of each other.
- **Simulation:** Haversine-derived synthetic estimates (distance × 1.3; assumed 28 km/h). It does not provide real road distance and never contacts a routing service until a map is explicitly opened.
- **Road network:** on-demand matrix of road-distance (meters) and driving-duration (seconds) from the **public OSRM demonstration service** (subject to provider availability and policy). Road distances correspond to fastest-road-path routes, not necessarily shortest-distance paths. No live traffic.
- Four computation choices: Greedy nearest neighbor, exact directed Held–Karp (small n), greedy + 2-opt (correct for asymmetric road matrices), and a limited **single-depot multi-rider cheapest-insertion heuristic** with a maximum number of stops per rider.
- Map: Leaflet + OpenStreetMap tiles, loaded only after checking the explicit external-coordinate disclosure consent box. OSRM route geometry is requested separately; dashed connectors are NOT street routes.
- **No Firestore writes or assignment mutations.** Road-planner endpoints are accessible only with an active admin custom claim and matching Firestore profile. The localhost API remains bound to `127.0.0.1:8787`.

## Very important boundaries

This is NOT a production vehicle-routing solver. Real FOODROUTE orders currently have address descriptors but no verified GPS/road coordinates, and the Phase 5A admin dispatch performs one ready order per rider. Phase 5B is an independent planning sandbox, not live dispatch. It has no order fetching, street-address geocoding, customer location collection, rider live GPS, rider safety navigation, real traffic, pickup-dropoff precedence, real vehicle capacity/weight, time windows, schedule constraints, or optimal fleet guarantees. Its fleet `capacity` counts stops, not parcel weight. The fleet heuristic minimizes total synthetic/road travel duration, **not** maximum rider finish time.

**Privacy and safety:** enter only non-sensitive test coordinates. Enabling road mode discloses coordinates to OSRM; displaying OSM map tiles discloses viewport information to the tile server. Do not use actual customers' private locations without consent, retention policies, and a suitable production provider. Route travel-time estimates are not safety-critical guidance.

## 1. Back up your project, then merge the overlay

Recommended: make a Git commit or copy your project folder first.

The patch archive `FOODROUTE_Phase5B_Road_Routing_Overlay.zip` contains **only** the files changed or added in Phase 5B, with directory paths starting at `apps/web/...`, `services/functions/...`, `packages/routing-engine/...`, and `docs/...`. Unzip it to a temporary directory first, review, then copy into the `FOODROUTE` project root. It deliberately includes **no** `.env.local`, `firebase.json`, Firestore rules, private keys, or `node_modules`.

Your already-approved animated landing page, restaurant dashboards, Firebase security rules, auth and ordering state transitions are unchanged.

**New dependencies:** `leaflet` and `@types/leaflet` are in the updated `apps/web/package.json`; install them by running `npm install` inside `apps/web`.

## 2. Install and test DAA algorithms independently

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\packages\routing-engine
npm run test
```

The package builds then tests the old academic TSP routines and the new **directed** road matrix, exact optimum, 2-opt, capacity checks, and returned-to-depot route invariants.

## 3. Run the trusted local backend

You already configured local Google Application Default Credentials and your Firebase project.

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
$env:GOOGLE_CLOUD_PROJECT = "foodroute-711d9"
npm install
npm run typecheck
npm run dev:api
```

The local backend prints `FOODROUTE LOCAL ORDER API: http://127.0.0.1:8787 (LOCAL DEVELOPMENT ONLY)`.

- Health test: `http://127.0.0.1:8787/api/health` returns `{ "ok": true, "mode": "local-dev" }`.
- New `POST /api/roads/plan` accepts `{ points, riders, capacity, mode, externalConsent }` and returns metrics/plans. Requires admin Firebase ID token.
- New `POST /api/roads/geometry` accepts `{ points, indices, externalConsent }` and returns GeoJSON coordinate pairs plus road-distance/duration metrics when OSRM responds. Also requires admin ID token.
- Both are read-only. The external OSRM demo server may be offline or reject traffic. If it fails, **no silent fake road data is substituted**; select explicit simulation instead.

**DO NOT publish/expose port 8787 to the internet or try production deliveries through the demonstration provider.**

## 4. Start the frontend

In another PowerShell terminal:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npm run build
npm run dev
```

Retain your existing `apps/web/.env.local` values, including `VITE_ORDER_API_MODE=local`. This is only for development. Sign in as the distinct admin account you already provisioned.

Open: **`http://localhost:5173/admin/route-planner`**. You can also follow **Road planner** in `/admin/dispatch`.

## 5. Walkthrough

1. With admin signed in, choose **Offline simulation**. Leave the 5 sample points selected, choose **2 riders** and **3 stops per rider**, then click **Calculate route comparisons**.
2. Switch among **Greedy**, **Greedy + 2-opt**, **Held–Karp**, and **Multi-rider**. The displayed paths must start and end at the shared kitchen. Exact DP is the mathematical optimum for a single TSP tour under the supplied matrix, not optimal multi-rider dispatch.
3. For a road-based comparison, select **Road network · OSRM demo**, read and check the consent box, then request a matrix. If OSRM fails, the page will show an explicit error, not simulated numbers labeled as road distances.
4. Click **Show interactive map** once consent is checked. For road mode, **solid lines** represent fetched OSRM geometry; **dashed lines** are rough stop-order connectors if geometry is unavailable. In simulation, all connectors are approximate and not actual roads.
5. Run the existing Phase 5A checkout and rider-dispatch tests independently. This new page DOES NOT create `deliveryRoutes`, write Firestore orders, or assign live riders.

## 6. No Firebase rule changes required

This Phase 5B overlay does **not** edit `firebase/firestore.rules` or add Firestore collections. Your Phase 5A 14/14 emulator test result remains the baseline. No live `firebase deploy` is required for the planner source code because it runs locally.

When checking Phase 5A rules again, run the emulator test **from the FOODROUTE root**:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE
npx firebase-tools emulators:exec --only firestore --project demo-foodroute-local "npm --prefix apps/web run test:rules"
```

## 7. External-provider constraints

- OSRM reference: https://project-osrm.org/docs/v5.24.0/api/ (table/route API).
- Demo server: `https://router.project-osrm.org`; limited to occasional manual tests. This build throttles requests, enforces small stop counts, and uses a fixed HTTPS endpoint. The service has no uptime guarantee; do not rely on it for commercial production.
- OSM map tiles: https://operations.osmfoundation.org/policies/tiles/ — respect attribution, caching, tile requests, and the no-bulk-download rule. Leaflet shows attribution. Replace public tile servers with a production-compatible provider if traffic grows.
- The road routing profile is **driving**, not tuned to motorbikes, traffic, food-readiness or real-time traffic delays.

## 8. Validation and current limits

Automated checks performed for this package in the authoring environment:

- Standalone `packages/routing-engine` TypeScript compile passed and both TSP test files passed.
- Source TS/TSX syntax and relative import existence checked.
- ZIP archives integrity checked.

`npm install` for the full web dependencies could not complete in the authoring environment (`EAI_AGAIN` DNS resolution of npm registry). **Full React TypeScript build, backend Firebase Admin runtime, OSRM network calls and browser map must be verified locally in your VS Code environment.**

## 9. Proposed next milestones

- **5C:** privacy-safe geocoding of verified restaurant and customer addresses, appropriate paid/self-hosted road matrix and map tiles, map-bound merchant service areas, persisted route quote metadata, error budgets/caching/quotas.
- **5D:** trusted integration with order readiness, pickup/drop-off precedence and time windows, versioned optimization preview and commit, per-rider capacity, cancellation/reassignment and audit, real VRPPD or VRPTW solver.
- **Production:** robust backend deployment, consented tracking with freshness/retention controls, monitoring, access logs, policy compliance, accurate billing and route performance measurements.

## Diagnostics

- **`Not found` at port 8787 root** is normal; use `/api/health`.
- **`Missing script: dev`**: run frontend from `apps/web`, not root.
- **`NO_APP`**: make sure the Phase 4 Admin SDK lazy-init `order-core.ts` fix is present.
- **Road matrix unavailable**: demo OSRM may be temporarily unavailable; use simulation and do not mistake synthetic numbers for road data.
- **401/403 on road planner API**: sign in to your active, approved administrator account and start local backend with the correct project ID. Customer/rider accounts cannot call these admin-only endpoints.
- **Rider online but no active offer**: independent Phase 5A dispatch state; inspect `deliveryRoutes` before assuming an order was assigned. Phase 5B deliberately does not alter it.
