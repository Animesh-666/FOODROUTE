# FOODROUTE 2.0 — Phase 5C: Live-order-aware routing preview (safe first release)

**Base:** Phase 5B, including the previously fixed `RoadMap.tsx` cleanup. **Deployment:** localhost, Spark-plan Firebase project `foodroute-711d9`. **Mode:** administrator-only, *read-only* development preview.

## What this phase actually does

- Loads up to 50 ready and **unassigned** order references from the real Firestore project, grouped by their approved restaurant. The discovery query considers at most 75 recently returned `ready_for_pickup` documents (Firestore ordering is not guaranteed without an explicit orderBy).
- Lets an authenticated, active administrator select **one restaurant** and up to **seven** ready, unassigned order IDs.
- Requires manually entered **non-sensitive sample coordinates**: one example kitchen and one example point per order. The positions are initially illustrative locations near Berhampore. **These are NOT customer location coordinates or actual order destinations.** A required acknowledgement makes this explicit.
- Before computing, the trusted backend rereads each selected order, refuses assigned/changed orders, checks every order belongs to the same restaurant, and confirms that restaurant remains active.
- Runs existing Phase 5B simulation or OSRM-demo route algorithms; returns Greedy, Held–Karp exact TSP, Greedy + 2-opt, and a limited fleet heuristic, along with an informational snapshot fingerprint and the verification time.
- Provides a read-only comparison and optional consent-gated Leaflet map. **This page creates NO `deliveryRoutes`, does NOT reserve riders and NEVER changes orders or delivery status.**
- Keeps the Phase 5A dispatch module untouched (single ready order assigned to one available rider). It DOES NOT connect real delivery geography or automate fleet dispatch.

## Files in the ZIP overlay

```
apps/web/src/app/App.tsx
apps/web/src/features/dispatch/AdminDispatchPage.tsx
apps/web/src/features/road-planner/RoadPlannerPage.tsx
apps/web/src/features/road-planner/LiveOrderRoutePage.tsx
apps/web/src/features/road-planner/live-route-preview.css
services/functions/src/orders/dev-server.ts
services/functions/src/road/live-order-validation.ts
services/functions/src/road/live-orders.ts
services/functions/tests/live-order-validation.test.cjs
services/functions/package.json
docs/PHASE5C_LIVE_ORDER_PREVIEW_SETUP.md
```

**No Firestore rules, indexes, `.env.local`, credential files, or landing-page components are replaced.** The overlay must be applied over your working Phase 5B installation, not used alone as a fresh project.

## Step-by-step installation

1. **Back up first.** Commit your current working source with Git or copy the project folder. Unzip the overlay into a TEMPORARY folder, compare changes, then copy each file into the matching FOODROUTE folder.
2. No `firebase deploy` required. All added endpoints use the trusted local Admin SDK and existing Firebase admin permissions.
3. In a PowerShell terminal start the backend:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
$env:GOOGLE_CLOUD_PROJECT = 'foodroute-711d9'
npm install
npm run typecheck
npm run test:live
npm run dev:api
```

4. In a DIFFERENT terminal start the web app:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npm run build
npm run dev
```

5. Confirm `http://127.0.0.1:8787/api/health` responds with `{ "ok": true, "mode": "local-dev" }`. If `EADDRINUSE 8787`, stop the **old** FOODROUTE backend in another terminal rather than trying to start two copies.
6. Sign in using your separate **admin** test account and open `http://localhost:5173/admin/live-route-preview`. A link is also available from **Dispatch desk** and **Road planner**.

## Live demo workflow

1. Use the customer account to place a **test** order via `/restaurants` and `/checkout`.
2. As the owner of 90'S PALACE, open `/restaurant/orders` and progress it through `placed → accepted → preparing → ready_for_pickup`.
3. Return to the admin account and select **Refresh orders** on `/admin/live-route-preview`.
4. Choose the restaurant and one or more *unassigned* ready order IDs. If Phase 5A has already assigned the order to a rider, it is deliberately excluded. Create a **new** test order instead.
5. Keep the **illustrative** sample points or edit to other non-sensitive fictitious positions, select riders/capacity, and check the **sample-coordinate acknowledgement**.
6. Begin with **Offline simulation**, then click **Verify & preview routes**. Check the route comparison, method tabs, and labels linking the real order IDs to sample stops.
7. If you choose **OSRM demo road network**, review and check separate external-service consent before calculating. OpenStreetMap tile loading also requires consent. OSRM demo can rate-limit or be unavailable; do not present synthetic simulation as a real road result.
8. Check that Firestore orders remain unchanged. To actually dispatch, go to `/admin/dispatch` and use the existing independent **single-order** workflow.

## API endpoints (local only)

| Path | Method | Role | Writes? |
| --- | --- | --- | --- |
| `/api/roads/eligible-orders` | POST | active admin | No |
| `/api/roads/live-preview` | POST | active admin | No |

Both require verified Firebase ID tokens; the backend also checks Firebase Auth role claims and the active Firestore user profile. `eligible-orders` returns order ID, restaurant ID/name, city and update timestamp only, not the street address. `live-preview` verifies 1–7 distinct ready unassigned orders from one restaurant before computing any route.

**Request** to live preview:

```json
{
  "restaurantId":"rest_<real-id>",
  "orderIds":["ord_<real-id>"],
  "points":[{"id":"depot","label":"Illustrative kitchen","lat":24.1032,"lng":88.2517},{"id":"stop1","label":"Illustrative stop","lat":24.1181,"lng":88.2654}],
  "mode":"simulation",
  "riders":1,
  "capacity":3,
  "sampleLocationsConfirmed":true,
  "externalConsent":false
}
```

Road mode requires `externalConsent:true`. **Do not use real customer coordinates in this development tool.** Backend canonicalizes route labels before making any OSRM request, rather than passing address labels or personal information.

## What Phase 5D must address

This is an *order-aware demo*—not geographic, optimized real dispatch. Before a live route can be trusted or committed, add controlled restaurant/customer geolocation with informed opt-in and retention, verified geocoding, road-provider agreement/rate limits, customer data minimization, batch pickup/drop-off precedence, capacities, time windows, versioned quotes with expiry, transactional preview/commit with rider eligibility recheck, cancellation/reassignment, audit trails, and realistic performance measurements. Do not publicly expose the local API or publish OSRM demo use as production routing.

## Validation disclosure

The overlay was syntax/relative-import inspected and the pure selection validation passed its standalone test cases. Full dependency-backed TypeScript, emulator, actual Firestore order-preview responses and UI browser rendering must be run in your environment. Existing Firebase rules were not modified by this overlay.
