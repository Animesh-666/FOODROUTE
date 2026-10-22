# FOODROUTE — Phase 5 Delivery & DAA Laboratory (Spark-local MVP)

**Version:** 0.5 · **Required existing phase:** Phase 4 with the Firebase Admin lazy-initialization fix.

## Why this is Phase 5A, not finished delivery logistics

The health endpoint on `http://127.0.0.1:8787/api/health` confirms the local backend starts; it does **not** prove checkout, Firestore indexes, restaurant state transitions, or integration tests are complete. Test those before relying on Phase 5.

This package adds two independent capabilities:

- **Live Firestore operations:** rider application, trusted rider approval, online/offline availability, admin preview & commit, rider offer acceptance/rejection, pickup and delivery completion, customer order status. **One rider, one ready order, one pickup then one drop-off**; no GPS, road distance or scheduling optimality claims.
- **Algorithm Laboratory:** Greedy nearest-neighbor, Held–Karp exact DP, and Greedy + 2-opt over a **synthetic Euclidean metric matrix**. This is a demo, not a live map. Algorithms never alter production orders.

No live rider GPS tracking, payment settlement, proof of handover, vehicle capacity, re-optimization, real routing, push notifications, external map integration, or real-time navigation are provided. This is **local testing using real Firestore data**. Never publicly expose port 8787 or deploy this unaudited server.

## 1. Back up and merge

1. Commit/backup your current working `FOODROUTE` directory. Extract ZIP into a temporary folder.
2. Merge `apps/web/` and `services/functions/` **without replacing** `.env.local` or unrelated source changes. The approved homepage CSS, art, and main landing components are unchanged.
3. Merge and review `firebase/firestore.rules`; do not replace any Phase 4 production rules with older revisions.
4. Add `packages/routing-engine/` and this guide. Keep root `firebase.json` and existing Firebase configuration.
5. Ensure `apps/web/.env.local` contains `VITE_ORDER_API_MODE=local` and all your existing Phase 2 Firebase values. No service account keys belong here.

## 2. Firestore rules emulator verification

From root (Java JDK required):

```powershell
npx firebase-tools emulators:exec --only firestore --project demo-foodroute-local "npm --prefix apps/web run test:rules"
```

All existing Phase 3/4 tests and new Phase 5 rider/route tests must pass. Denied writes inside `assertFails` are expected. **Review changes before deploying real rules**:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project foodroute-711d9
```

This deploy affects actual project rules. Do not temporarily use `allow read, write: if true`.

## 3. Run the backend & website

Your ADC permissions were previously configured. Confirm project and start the local API from an independent PowerShell terminal:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
$env:GOOGLE_CLOUD_PROJECT = 'foodroute-711d9'
npm install
npm run build
npm run dev:api
```

Health check: `http://127.0.0.1:8787/api/health` → `{ "ok": true, "mode": "local-dev" }`.

In **another** terminal:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Test the DAA package independently:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\packages\routing-engine
npm run test
```

## 4. Create separate demo accounts

Use **three separate verified Firebase Authentication users**:

- `restaurant`: the already approved 90'S PALACE account; can create products and mark orders `ready_for_pickup`.
- `customer`: stays role `customer` and places a COD development order. Do not reuse the restaurant owner, because public account role conversion is disallowed.
- `rider`: a **different verified customer** first applies at `/rider/apply`, then gets approved through trusted local Admin SDK.
- `admin`: a **fourth account**, provisioned through the existing `services/functions/scripts/bootstrap-admin.mjs` script. Admin must have an existing active customer profile and a real authenticated Firebase UID. The admin account must not be a restaurant owner or rider.

## 5. Approve a rider securely (Spark plan)

1. Create a fresh *customer* account using a real email you control and verify it.
2. Sign in with that account and apply at `http://localhost:5173/rider/apply`.
3. Confirm `riderApplications/{RIDER_UID}` has `status:pending` in Firestore.
4. Run **only** from your trusted local terminal with Google ADC:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
$env:GOOGLE_CLOUD_PROJECT = 'foodroute-711d9'
node .\scripts\approve-rider-local.mjs RIDER_UID --confirm-project-id=foodroute-711d9
```

5. Sign the rider out and in again. `/rider/dashboard` now displays their availability. Rider must explicitly click **Go online**.

### Admin account (trusted operation; separate test user)

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
$env:GOOGLE_CLOUD_PROJECT = 'foodroute-711d9'
node .\scripts\bootstrap-admin.mjs ADMIN_UID --confirm-project-id=foodroute-711d9
```

Do not post UIDs, OAuth credentials, ID tokens, or secrets publicly. Check the UID and project before a role grant. Sign the admin out and back in.

## 6. Full end-to-end scenario

1. As customer: `/restaurants`, open the approved 90'S PALACE menu, add a published dish, submit a test COD order via `/checkout` and note the order ID.
2. As restaurant: open `/restaurant/orders` and move that order `placed` → `accepted` → `preparing` → `ready_for_pickup`.
3. As rider: `/rider/dashboard` → **Go online**.
4. As admin: `/admin/dispatch` → select ready order and available rider → **Preview assignment**. This has **no side effects**.
5. Click **Commit dispatch**; the backend transaction verifies order and rider state, then writes a versioned route record. It reserves only one available rider for one ready order.
6. As rider: accept → confirm food collected → confirm delivered. Or decline offered assignment to free the order for reassignment.
7. As customer: `/orders` should progress to `picked_up`, then `delivered` (restaurant preparation stages still apply).
8. Open `/algorithm-lab` to compare TSP heuristics independently; it cannot mutate Firestore orders.

## 7. API paths and security

Authenticated POST requests on local `127.0.0.1:8787`:

| Path | Allowed | Purpose |
|---|---|---|
| `/api/dispatch/preview` | Admin only | Validate a suggested order/rider pair (no writes) |
| `/api/dispatch/commit` | Admin only | Transactionally reserve order, rider, route; reject stale preview |
| `/api/rider/availability` | Rider only | Mark available/unavailable when not busy |
| `/api/rider/action` | Assigned rider only | Accept, decline, collect, deliver |

All API paths verify Firebase ID tokens, privileged custom claims, active Firestore profile role, and document ownership/state. Browser clients cannot write `deliveryRoutes`, `deliveryAgents`, or `orders` directly. Clients read only their permitted records; no public location tracking is stored.

## 8. Database collections

`riderApplications/{uid}` — self-submitted pending application; review via Admin SDK.

`deliveryAgents/{uid}` — trusted registered rider, availability, active route reservation.

`deliveryRoutes/{routeId}` — trusted assigned rider, one order, version, pickup/dropoff descriptors and lifecycle. No exact GPS coordinates.

`orders/{orderId}` — inherits Phase 4 fields plus `assignedRiderUid`, `activeRouteId`, `assignmentStatus`, and `status: picked_up | delivered` as applicable. `orders/{orderId}/events` tracks server transitions.

## 9. Scope limits and next steps

Before public release: dedicated trusted backend (not loopback), route preview/commit input versioning, richer courier eligibility, verification of actual pickups and handovers, graceful cancellation/reassignment, secure logging/audits, payments, scalable routing graph + map travel matrix, and real-world delivery time windows. Add a road-distance service and address geocoding with informed consent before claiming optimized journeys. Build multi-rider VRPPD only after constraints and data exist. Authentication role changes must remain administrative.

**Troubleshooting:** If `npm run dev` fails from the root, `cd apps/web`. If `npm run dev:api` fails, confirm the Phase 4 lazy-init `order-core.ts` patch is present and valid ADC credentials are available. Do not run the local API publicly.
