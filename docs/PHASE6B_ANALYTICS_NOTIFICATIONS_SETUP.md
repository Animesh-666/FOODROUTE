# FOODROUTE 2.0 — Phase 6B: Analytics, Activity Notifications & DAA Reports

Version: Phase 6B preview, incremental overlay on top of **Phase 5D plus Phase 6A and navigation patches**.

## Safeguards and source basis

- Based on the latest stored FOODROUTE project source, Phase 5D optimized-dispatch overlay, Phase 6A four-dashboard overlay and dashboard-login/navigation patch. Your locally edited copy may differ: compare overlapping files before replacing.
- The existing Floating Food hero, checkout, route optimizers, Firebase rules and Admin SDK transaction handlers are unchanged.
- **No new Firebase collections, writes, Cloud Functions, browser push service workers, email or FCM**. This is in-app notification activity derived from already authorized Firestore snapshots. A notification does not appear when the app is closed. Browser-session unread state is not synchronized across devices.
- Reports show **COD order value** only, never recognized revenue or verified payment, since current orders are cash-on-delivery with `payment.status = unpaid` at creation.
- Admin order chart intentionally queries at most 100 newest order documents; older/missing-timestamp documents may be excluded. Restaurant/customer order metrics are based on their own authorized order subscriptions, not a server-side audited ledger.
- All dashboards and pages still sit behind the existing `RequireRole` checks, Firebase custom claims, Firestore rules and backend controls. Do not weaken them to debug analytics.
- Algorithm comparisons benchmark a 2–9 vertex **synthetic Euclidean TSP**, not road-network ETAs, geolocation, motorcycle guidance or optimized delivery capacity.

## New pages

| Role | URL | Functionality |
| --- | --- | --- |
| Customer | `/customer/insights` | Personal status counts, creation trend, COD order values |
| Administrator | `/admin/analytics` | Most recent 100 order records, operational status/volume sample |
| Restaurant | `/restaurant/analytics` | COD order-value report, order trends, CSV export (no customer PII) |
| Rider | `/rider/history` | Own route ledger and completed-drop counts (multi-stop aware) |
| All roles | Dashboard top bar | In-app activity bell with order or route statuses |
| Public educational page | `/algorithm-lab` | Local greedy, 2-opt and Held–Karp cost and mean runtime comparisons |

### Notification behavior

- Customer: statuses of own orders.
- Restaurant: statuses of own restaurant orders.
- Admin: ready-for-pickup orders currently visible to admin.
- Rider: statuses of own routes, including multi-stop progress.
- Notice identifiers contain the record ID and current status, so a change creates a new in-app notice on next snapshot. "Mark all read" only records seen notice IDs in the current tab's `sessionStorage`. It never modifies Firestore and does not alter delivery state.
- Notifications appear inside authenticated dashboard views. The original standalone secondary pages remain unchanged.

## Merge and launch (Windows PowerShell)

1. **Commit or back up the existing project**, including any custom tweaks. Stop the Vite frontend process.
2. Extract `FOODROUTE_Phase6B_Analytics_Notifications_Overlay.zip` to a temporary folder. Review the affected `App.tsx`, `DashboardShell.tsx`, `dashboard.meta.ts`, and `AlgorithmLabPage.tsx`, particularly if you've modified these recently.
3. Copy/merge the overlay paths (`apps/web/...`, `docs/...`, `README_PHASE6B.md`) into `C:\Users\ANIMESH\Desktop\FOODROUTE`. **Never replace** `.env.local`, private credentials, `firebase/firestore.rules`, or anything under `node_modules`.
4. Keep the working Phase 5D localhost backend running at `127.0.0.1:8787`; no new API routes are needed for Phase 6B.
5. Run:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npx vitest run src/features/insights/analytics-core.test.ts src/features/insights/tsp-benchmark.test.ts
npm run build
npm run dev
```

## Role-by-role validation

1. **Customer:** log in at `/login`, ensure `/dashboard` redirects to `/customer/dashboard`; check bell and `/customer/insights`. Place a disposable test order through the established local COD flow, then mark it ready via the restaurant test account. With both accounts refreshed, the customer's notification should show the updated status; no notification should reveal another customer's order.
2. **Restaurant:** sign in as an approved restaurant. Check `/restaurant/analytics`, order counts, COD labels, and **Export COD report (CSV)**. The report contains only order IDs, timestamps, statuses, and value. Compare with `/restaurant/orders`; no customer location should be in the export.
3. **Administrator:** sign in with an active admin custom claim; visit `/admin/analytics`. Counts reflect **up to the newest 100 records**, not global all-time performance. Check the order activity bell and link to `/admin/dispatch`.
4. **Rider:** sign in with an approved test rider; visit `/rider/history` after a software-only Phase 5D test route completes. Check that a fully completed three-stop route counts as **three completed drop-offs**. Notification links lead to `/rider/deliveries`.
5. **DAA lab:** go to `/algorithm-lab` and vary the sample vertex count. Exact DP cost should not be higher than the heuristic costs (within floating point tolerance). Runtime milliseconds fluctuate by computer and are illustrative, not benchmarks suitable for production traffic prediction.
6. **Regressions:** test the existing customer checkout, restaurant order updates, admin optimized preview and rider online status. Phase 6B must not mutate order or dispatch state.

## Troubleshooting

- **Permission denied:** verify correct account role, active Firestore user profile, Firebase custom claim, and the same Firebase project for frontend and backend. Do not edit rules to grant wider access.
- **`failed-precondition` requiring index:** check Firebase index error and review the query before adding any index. The admin report uses a single-field order by `createdAt` (usually automatically indexed).
- **Empty charts:** only authorized existing records with `createdAt` timestamps appear in time-based charts. Completed route history is separate from order creation date.
- **Missing status changes in bell:** dashboard must be open and connected; notification list is a live snapshot feed, not a queued backend notification service. The admin bell only monitors currently ready orders.
- **`invalid_grant` backend:** refresh local `gcloud auth application-default login` or recheck system time and credential overrides. That is unrelated to this analytics overlay.

## Verification evidence for this overlay

- All staged TypeScript and TSX files parsed successfully and relative source imports were found.
- Core analytics + academic TSP benchmark modules compiled using standalone TypeScript and passed 8 direct Node.js smoke checks.
- The full React dependency-backed `npm run typecheck`, `npm run build`, and Vitest runs could **not** be completed in this sandbox: npm offline install reported `ENOTCACHED` for a dependency. They must run on your Windows machine.
- ZIP contents and integrity checked after packaging.

## Production follow-ups

Phase 7 should introduce server-side paginated aggregate reports (with verified payment settlements), durable server-authored event logs and opt-in push/email notifications, appropriate retention/privacy controls, query pagination, and monitoring. None of these are claimed to exist in Phase 6B.
