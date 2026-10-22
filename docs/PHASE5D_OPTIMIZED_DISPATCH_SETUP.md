# FOODROUTE 2.0 — Phase 5D: Secure Optimized Dispatch (bounded local development release)

## What this patch implements

Adds an admin-only **`/admin/optimized-dispatch`** page and a matching multi-order rider workflow. Uses existing restaurant and customer-confirmed coordinates, with **no third-party routing provider calls** in dispatch. Includes up to six ready, unassigned orders **from one restaurant**, up to three approved available riders, and a maximum of three deliveries per rider. Computes a capacity-limited cheapest-insertion + directed 2-opt plan using a **synthetic** Haversine × 1.3 matrix and assumed speed of about 28 km/h. Estimated route distances/times are illustrative, **not actual road-network routing, navigation, live traffic, a guaranteed delivery time, or an optimized real-world VRP solver.** All routes model a return to the kitchen, though rider delivery completion occurs at the final drop-off.

**Not implemented yet:** rider location and dynamic departure location, actual road-time matrices for confidential customer destinations, pickup/drop-off across multiple restaurants, live tracking, time-window constraints, weight/volume capacity, cancellation/reassignment after pickup, payment settlement, proof of delivery, robust distributed rate limits and production deployment. Coordinates are *self-confirmed* by customer/restaurant users, not independently verified.

**Data impact:** IMPORTANT — unlike Phase 5C read-only previews, **Phase 5D commit writes actual records to Firestore** (`orders`, `deliveryAgents`, `deliveryRoutes`, and order event logs). Use only development test orders and test accounts. Do not assign genuine deliveries or send private coordinates to public demonstration services.

## Install safely

1. Back up or commit your working `C:\Users\ANIMESH\Desktop\FOODROUTE` first. Extract the downloaded ZIP into a separate temporary directory. It contains only relative changed files; merge those into the FOODROUTE project root. **Do not delete your project or replace `.env.local`, Firebase credentials, Firestore rules or `firebase.json`.** If you have made subsequent edits, compare the overlapping files (especially `App.tsx`, `dev-server.ts`, `RiderDashboard.tsx`).
2. Install backend and run its tests:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
npm install
npm run typecheck
npm run test:optimized
npm run test:live
```

3. Start **one** backend, in its own terminal. Stop the previous backend on port 8787 first (Ctrl+C in the old Node terminal). No public port exposure:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\services\functions
$env:GOOGLE_CLOUD_PROJECT = "foodroute-711d9"
npm run dev:api
```

`http://127.0.0.1:8787/api/health` should return `{ "ok": true, "mode": "local-dev" }` (only verifies the API starts).

4. In a separate terminal:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npm run build
npm run dev
```

5. Sign in with the existing **active admin** account (matching Firebase custom claim and Firestore profile). Open `http://localhost:5173/admin/optimized-dispatch`. This is also linked in the Admin dashboard and manual Dispatch Desk.

## Recommended development test sequence (without real-world delivery)

- Configure the restaurant's pickup point under `/restaurant/location`, confirming the entrance and service radius. This release restores the local `/api/location/*` endpoints alongside all prior road and live-order-preview endpoints. If a location is not configured, the optimized preview deliberately refuses to run.
- Place fresh **test** orders from the customer checkout with *customer-confirmed sample/test delivery pins*. Earlier orders that lack the new `deliveryLocation` structure or have a stale restaurant location version cannot be committed. Progress those test orders to `ready_for_pickup` in `/restaurant/orders`.
- Approve test rider accounts through the **existing trusted** approval workflow; sign in as each rider and use the dashboard to set available. Never assign a role by altering browser code or bypassing Firestore rules.
- On the admin optimized dispatch page, choose one restaurant, up to six eligible test orders, 1–3 distinct available riders, and a 1–3 order-per-rider limit. Start with **one order and one rider**, then 3 orders and 2 riders.
- Click **Generate secure preview**. Examine the route order and *synthetic* metrics. Preview is read-only. The signed token is tied to the admin, current order/rider/location snapshot, and expires after **3 minutes** (or when the local server restarts).
- Click **Commit these route offers** on your test orders. A Firestore transaction rereads the chosen orders, restaurant/location and riders, validates every one is still eligible and checks the signed route. It creates one route per selected rider, reserves each order once, marks riders busy, and writes audit events. **All assignments commit together or none do.**
- Open `/rider/deliveries` using a designated **test rider** account. Accept or decline the optimized route. Declining before pickup frees all included orders. Accepting, confirming all food collected, and marking drop-offs in sequence updates orders one at a time. Rider availability returns when the last order is completed.
- Check the customer `/orders` and restaurant `/restaurant/orders` statuses. On an admin account, ensure a second commit attempt of the same preview fails, and that an assigned order disappears from eligible choices.
- Independently repeat one old manual dispatch test via `/admin/dispatch` to confirm backward compatibility.

### Security and privacy

- All new endpoints use the local backend's Firebase ID token authentication. Admin operations verify *active admin custom claim plus active Firestore profile*. Multi-order rider actions verify *active rider claim plus profile* and actual ownership of the route.
- No client writes to protected order/rider/route records. Existing Firestore rules remain unchanged. No new rules or indexes need deploying for this patch.
- Preview commitments use server-signed, short-lived tokens and rerun validation in a Firestore **transaction**. No external OSRM calls, no contact info or actual coordinates placed into response preview or route stop docs. Existing order records may already include private customer address and confirmed point; rules restrict reads.
- All optimized endpoints remain **LOCAL DEVELOPMENT ONLY** under `127.0.0.1:8787`. The ephemeral in-memory signing secret and single-node setup are **not safe for horizontal scaling**. Production will need a durable server-side key, audit policies, monitoring, rate limiting, vetted routing provider and real integration tests.
- Only use test coordinates and accounts; do not conduct actual deliveries based on these synthetic route metrics.

## New API endpoints

| POST endpoint | Required role | Behavior |
|---|---|---|
| `/api/optimized/preview` | Active admin | Validates 1–6 eligible orders, 1–3 available riders and confirmed pickup/dropoff points; returns plan + signed token; no writes |
| `/api/optimized/commit` | Same active admin | Verifies signed token and rereads all relevant state in one Firestore transaction; creates offered route records and reserves orders/riders |
| `/api/optimized/rider-action` | Assigned active rider | `accept`, `reject`, `pickup` or sequential `deliver` with the expected `orderId` |

Legacy `/api/dispatch/*`, `/api/rider/*`, `/api/roads/*`, and `/api/location/*` continue to exist.

## Status of checks performed when packaging

- 10/10 Node.js tests passed: 5 pure selection/optimizer tests and 5 mocked Firestore/backend workflow tests (including signed preview and state transitions). **Mocked Firestore transactions do not establish that real Firebase permissions or concurrency behave exactly as expected.**
- All modified TS/TSX parsed successfully; relative imports resolved; source ZIP integrity verified.
- A full `npm run typecheck`, frontend production build, real Firestore transactions, Emulator regression tests, and browser tests **were not possible in the authoring environment** because npm dependencies were not installed there. **Run the above scripts locally and share errors before doing further integration.**

## Troubleshooting

- **`EADDRINUSE 127.0.0.1:8787`**: stop the other local backend process rather than trying to run two.
- **`Missing restaurant pickup`**: configure restaurant's location under `/restaurant/location` and use *new* test orders created after that version was saved.
- **`Location changed`**: regenerate test order/preview as indicated. Version mismatch blocks stale addresses.
- **`Rider busy` / `Order assigned`**: refresh; never bypass the checks by editing Firestore directly.
- **`Preview expired`**: repeat preview and commit promptly. Restarting the local API also invalidates preview tokens.
- **`404 optimized/preview`**: new dev-server overlay may not be copied or old backend process is still running; restart the updated API.
- **`403 admin required`**: sign into verified admin, not rider/restaurant/customer, and refresh claims by signing in again if recently approved.
