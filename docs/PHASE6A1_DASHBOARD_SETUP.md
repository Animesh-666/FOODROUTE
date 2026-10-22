# FOODROUTE 2.0 — Phase 6A.1 Dashboard Foundation

**Scope:** React 19 + TypeScript, React Router 7, Firebase Authentication/Firestore.  
**Source basis:** Phase 5B full-source reference + RoadMap TS fix + Phase 5C live-order preview overlay. This package changes only frontend files.  
**Status:** Implementation overlay; complete Vite build and real-browser/Firebase role tests need to be run in your local VS Code environment.

## 1. What this adds

- A premium FOODROUTE dashboard shell with warm ivory content panels, orange accents, dark charcoal sidebar and familiar typography.
- Responsive desktop sidebar (collapsible), mobile navigation drawer (Escape + backdrop + keyboard focus cycle), title-aware topbar, account menu with sign-out, and a home link.
- Reusable `DashboardShell`, `DashboardIcon`, `DashboardCard`, `StatCard`, `StatusBadge`, `DashboardTable` and `EmptyState` components.
- Role-based dashboard navigation for customer, restaurant owner, rider and administrator.
- `/dashboard` auto-redirects the signed-in user to their role's landing route; sign-in defaults there unless the user came from a protected deep link.
- Existing operational pages remain under their old URLs but now display inside the dashboard shell.
- Account changes continue to happen through the original Firebase service.
- Dashboards display **Firestore-backed counts only**, with loading, error and no-data states. Nothing is invented as a live operational statistic.

### Routes

| Role | New overview | Existing operational routes maintained |
|---|---|---|
| Customer | `/customer/dashboard` | `/orders`, `/checkout`, `/restaurants` (public browse) |
| Administrator | `/admin/dashboard` | `/admin/dispatch`, `/admin/restaurant-applications`, `/admin/route-planner`, `/admin/live-route-preview` |
| Restaurant | `/restaurant/overview` | `/restaurant/dashboard` (menu editor), `/restaurant/orders` |
| Rider | `/rider/overview` | `/rider/dashboard` (availability + delivery offers) |

Admin also gains `/admin/algorithm-lab` inside the shell; the original `/algorithm-lab` remains publicly available for education/demo use. Account and public restaurant screens intentionally retain their existing standalone layouts.

## 2. Install safely in VS Code (Windows PowerShell)

**IMPORTANT:** This is an **overlay ZIP**, not a replacement for your full project. **Do not delete your backend, Firebase files, or working project.**

1. Close Vite and back up or commit your current FOODROUTE source.
2. Extract `FOODROUTE_Phase6A1_Dashboard_Foundation_Overlay.zip` into a **temporary directory**.
3. Check the `apps/web/src/...` file paths listed below.
4. Merge the overlay's `apps/web/src` folder into your existing `C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web\src`. Copy `docs/PHASE6A1_DASHBOARD_SETUP.md` into `FOODROUTE/docs` if wanted. Windows may ask to overwrite **only** the handful of modified frontend files.
5. Keep `apps/web/.env.local`, `firebase.json`, Firestore rules, backend files, `packages/routing-engine/` and your approved `src/features/landing/` components untouched.

This overlay contains **no** `.env`, credential, service-account key, SDK config, Firebase Rules, `node_modules`, or changed backend code. No Firebase redeployment is necessary.

### Expected file inventory

**Changed files**:

```
apps/web/src/app/App.tsx
apps/web/src/features/restaurants/RequireRole.tsx
apps/web/src/features/auth/LoginPage.tsx
apps/web/src/features/auth/AccountPage.tsx
```

**New files**:

```
apps/web/src/components/dashboard/dashboard.config.ts
apps/web/src/components/dashboard/dashboard.config.test.ts
apps/web/src/components/dashboard/DashboardIcon.tsx
apps/web/src/components/dashboard/DashboardUI.tsx
apps/web/src/components/dashboard/DashboardShell.tsx
apps/web/src/components/dashboard/dashboard.css
apps/web/src/features/dashboard/RoleOverview.tsx
apps/web/src/features/dashboard/WorkspaceRedirect.tsx
```

## 3. Install, validate, and run

From VS Code PowerShell:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npx vitest run src/components/dashboard/dashboard.config.test.ts
npm run build
npm run dev
```

Open `http://localhost:5173`. Sign in with a verified test account, or visit `/dashboard` directly to redirect to its role's workspace.

**Do not run `npm test` by itself** if your test suite includes Firestore Rules integration tests. Those need the emulator, separately:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE
npx firebase-tools emulators:exec --only firestore --project demo-foodroute-local "npm --prefix apps/web run test:rules"
```

`npm run dev:api` in `services/functions` is still required for **existing** order updates, rider actions and dispatch. The dashboard overview pages themselves only read Firestore and do not require the local API.

## 4. Verification checklist

1. Sign in as **customer**: `/dashboard` -> `/customer/dashboard`; see your own order count and shortcuts; open `/orders` in the sidebar.
2. Sign in as **restaurant owner**: `/dashboard` -> `/restaurant/overview`; see *your* menu/order counts; `Manage menu` opens old `/restaurant/dashboard` within the shell; save/update still works.
3. Sign in as **rider**: `/dashboard` -> `/rider/overview`; online/offline status comes from `deliveryAgents/{uid}`; `My deliveries` opens original rider workflow.
4. Sign in as **administrator**: `/dashboard` -> `/admin/dashboard`; ready-order/eligible-rider counts come from Firestore; dispatch, live-order preview, road planner and DAA laboratory open in the shared shell.
5. Try an **unauthorized** route, e.g. customer visiting `/admin/dispatch`: access must be denied or redirected. For protected roles the UI checks both an active matching profile and Firebase ID-token `role` custom claim. This does **not** replace server-side authorization.
6. Test at desktop width, 768px and 390px. On mobile: open sidebar, navigate with keyboard, press Escape to close; account menu and sign out should function.
7. Confirm the original `/` animated Floating Food landing page looks exactly as before, and menus, orders, admin dispatch and route preview still work.

### Handling role-claim mismatches

If a newly approved rider/restaurant/admin has the correct Firestore profile but sees `Your session does not have the … permission`, **sign out and sign back in**. The gate refreshes their ID token. Do **not** edit the role manually or weaken Firestore rules. Role grants are trusted operations from Phase 3/5 approval scripts.

## 5. Important security and scope constraints

The frontend role guard is **presentation-level protection**. Firestore security rules and trusted backend operations must continue enforcing actual access to data and write actions. This patch does not modify those rules, backend authorization, dispatch transactions, or store data in localStorage. The two operational URLs `/restaurant/dashboard` and `/rider/dashboard` are kept to avoid breaking earlier screenshots/links.

No fictitious earnings, sales totals, notifications, map locations or route quality improvements are shown. The mini analytics represent only documents this account can read. Some Firestore queries may need a composite index already configured in your current deployment; errors display rather than disappearing silently.

### Current verification limitations

Authoring-time checks: TypeScript/TSX syntax parsing, relative import target checks, route inventory checks, standalone runtime validation of dashboard navigation, ZIP integrity, and asset preservation. A complete npm dependency install timed out / was unavailable in the authoring environment, so **full `npm run typecheck`, `npm run build`, actual browser screenshots and live Firebase role tests remain to be verified locally**.

## 6. What comes next

Phase 6A.2 refines the **Customer Dashboard** with improved order timeline, saved addresses and favorites where supported. Phases 6A.3–6A.5 give admin, restaurant and rider dashboards richer task-specific panels. Phase 6A.6 provides a full cross-role permissions/end-to-end test pass. Phase 5D optimized dispatch and the later production stages remain separate.
