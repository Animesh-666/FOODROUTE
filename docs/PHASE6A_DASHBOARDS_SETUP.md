# FOODROUTE 2.0 — Phase 6A (all six steps) — Setup and verification

## Status and source basis

This is a **code implementation** of 6A.1–6A.6, built against the saved Phase 5C full-source reference, with compatibility for the separate Phase 5C live-route-preview overlay. It is not a live deployment. It does not connect to your local Git checkout automatically.

- The existing Floating Food homepage, hero artwork and global styles are preserved.
- Four role-specific overview routes use **existing live Firestore subscriptions**; no fake KPI values are inserted.
- Existing restaurant menu editor moves from `/restaurant/dashboard` to `/restaurant/menu`.
- Existing rider delivery controls move from `/rider/dashboard` to `/rider/deliveries`.
- Existing restaurant orders, rider assignments, admin dispatch, road planner and live order preview URLs stay in place.
- `/dashboard` routes authenticated users based on their current active Firestore profile.
- Protected routes also check the Firebase Auth custom claim for admin, rider and restaurant (the `customer` role normally has no claim).
- **This is frontend authorization UX only.** Deployed Firestore rules and the trusted local backend continue to enforce real access control. This patch does not edit Firebase rules or backend files.
- The Phase 5C location page `/restaurant/location` and the prior read-only live-order preview are retained. The overlay includes the optional live preview frontend files for projects that previously only had the location variant of Phase 5C.

## 1. Install safely

1. Back up or commit your current working `FOODROUTE` directory.
2. Extract `FOODROUTE_Phase6A_Dashboards_Overlay.zip` to a **temporary folder**; review changes.
3. Copy the `apps/web` and `docs` paths to the same locations in your existing FOODROUTE root. Merge instead of deleting directories. Files in `apps/web/src/features/dashboard/` are new; `App.tsx`, `RequireRole.tsx`, `LoginPage.tsx`, `AccountPage.tsx`, `Header.tsx` are updated. Two compatibility-only live preview files may already exist.
4. Keep `.env.local`, `firebase.json`, Firebase project IDs, Firestore rules, backend source, and all assets unchanged.
5. Check your previous local modifications to `App.tsx`: if you have custom routes, carry them into the updated router. The supplied file retains all known routes through Phase 5C.

## 2. Run TypeScript and unit tests

From VS Code PowerShell:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npx vitest run src/features/dashboard/dashboard.meta.test.ts
npm run build
npm run dev
```

The general `npm test` includes security rules tests requiring the Firebase Emulator. If tests fail for emulator availability, use:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE
npx firebase-tools emulators:exec --only firestore --project demo-foodroute-local "npm --prefix apps/web run test:rules"
```

No new dependencies are required for Phase 6A. The dashboard styles are scoped to `.frd`; heavy maps are lazy loaded. The source archive is intended to be integrated into your current checkout, not run with guessed Firebase credentials.

## 3. Test every dashboard (four separate accounts)

| Signed-in Firebase role | Destination | Existing feature links |
| --- | --- | --- |
| customer | `http://localhost:5173/customer/dashboard` | `/restaurants`, `/orders`, `/checkout` |
| admin | `http://localhost:5173/admin/dashboard` | `/admin/dispatch`, `/admin/route-planner`, `/admin/live-route-preview`, `/admin/restaurant-applications`, `/algorithm-lab` |
| restaurant | `http://localhost:5173/restaurant/dashboard` | `/restaurant/menu`, `/restaurant/orders`, `/restaurant/location` |
| rider | `http://localhost:5173/rider/dashboard` | `/rider/deliveries` |

Use `/dashboard` to automatically choose the correct one. The existing customer menu landing page `/` remains accessible without logging in.

**Customer:** sign in with a normal customer, verify approved restaurants and only that customer's orders show. Ordering still requires the local backend API.

**Admin:** sign in using the separately provisioned admin. Verify counts for ready orders, available riders and pending partner applications, with no invented total revenue metrics. Use trusted admin dispatch and approval pages via links.

**Restaurant:** sign in as the approved 90'S PALACE owner. Check menu count and kitchen queue. Click Menu Studio to edit dishes (the former restaurant dashboard moved to `/restaurant/menu`).

**Rider:** sign in as an approved rider. See active offers and actual availability; use My Deliveries for accept/pickup/complete actions, or change availability via the trusted local API. Do not interact with delivery controls while operating a vehicle.

## 4. Security checks (essential before claiming success)

- Try each other role's dashboard URL as a customer; it must deny access and must **not** mount the other role's Firestore listeners.
- Confirm token/profile role mismatches result in an access message and do not display private data.
- Sign out and verify private dashboard routes redirect to login.
- A newly approved admin/restaurant/rider must sign out and back in to refresh their Firebase ID token.
- Run existing Firestore rules emulator tests; do not weaken or redeploy rules unless later changes actually require it.
- Browser page security is not the server authorization boundary. Keep all privileged writes in trusted backend operations.

## 5. UI/UX checks

- Confirm the landing page looks exactly as before.
- On desktop verify sidebar navigation and 4 overview cards; on mobile verify menu button, overlay dismissal, Escape key, keyboard focus, and no side scroll.
- Verify real zero/empty/loading/permission-error states; dashboard figures must not display fake business totals.
- With system Reduce Motion enabled, decorative motion should stop.
- Only the overview gets the new shell. Existing operational pages keep their proven forms, dialogs and action controls to avoid disrupting working workflows.

## 6. Known scope limits

- Dashboard counts come from existing Firestore listeners; they are **not** historical aggregate analytics or validated collected sales. Restaurant delivered COD value is order value, not payment settlement.
- No new route committing, real rider GPS, online payments, restaurant hours or notification backend has been implemented here.
- The admin dashboard is an operational summary; rider approval remains trusted local script, not a new web-based approval endpoint.
- Some existing real-time queries may require an index or correctly deployed Phase 5A rules; do not use permissive rules to bypass errors.
- A full live Firebase four-role browser walkthrough must be completed in your VS Code environment before marking 6A.6 as production-verified.

## 7. Next stage

After all four dashboards and security checks pass, proceed to **Phase 5D** (verified location + versioned, transactional optimized dispatch), then 6B (analytics and remaining operational features), and Phase 7 (production hardening and deployment).
