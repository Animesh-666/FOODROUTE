# FOODROUTE 2.0 — Phase 5A: Delivery Partner MVP + DAA Lab

**This package extends Phase 4, including the prior Firebase Admin initialization fix.** It does not overwrite the approved Floating Food homepage. This is a tested source-code milestone, **not yet a live integrated delivery release**.

Read **`docs/PHASE5_DELIVERY_DAA_SETUP.md`** before installing. Important: the health endpoint alone does not establish that Phase 4 checkout worked; complete the Phase 4 order scenario first.

### New routes

| URL | Feature |
| --- | --- |
| `/rider/apply` | Verified customer applies as rider (pending until trusted approval) |
| `/rider/dashboard` | Approved rider can toggle availability, respond to offers, confirm pickup/delivery |
| `/admin/dispatch` | Trusted admin previews and commits single-order dispatch |
| `/algorithm-lab` | Isolated synthetic TSP comparison (Greedy, Held–Karp, 2-opt) |

### Backend additions

`services/functions/src/dispatch/dispatch-core.ts` implements trusted authorization, transactional assignment, and rider status changes. `services/functions/scripts/approve-rider-local.mjs` is the Spark-plan local trusted role-grant operation. Existing `npm run dev:api` is extended with four routes. The local backend must stay bound to loopback.

Firestore rules add access controls for `riderApplications`, `deliveryAgents`, `deliveryRoutes`, and assigned rider order reads. All writes to orders/assignments/routes remain server-only. No realtime GPS collection is included.

### Verification summary

- Existing algorithm unit tests ran successfully against several metric graph sizes.
- TS and TSX source parsed correctly using TypeScript compiler parser.
- Full dependency-backed Vite build, Cloud Firestore emulator tests, ADC integration, and real-account dispatch still require verification in your VS Code environment.

Future routing with real distances and time windows is **not** implemented here; the algorithm lab uses synthetic graph distances and should not be used to dispatch real orders.
