# FOODROUTE 2.0 — Phase 6A Navigation & Login Upgrade

## Changes

1. **Post-login redirect for all roles:** `/login` and `/signup` now send the authenticated user to `/dashboard` using `replace` navigation. Already signed-in users opening these pages are also sent to `/dashboard`, rather than `/account` or an earlier remembered page.
2. **Role-specific landing:** `/dashboard` waits for Firestore profile + token verification and redirects to:
   - Customer: `/customer/dashboard`
   - Administrator: `/admin/dashboard`
   - Restaurant: `/restaurant/dashboard`
   - Rider: `/rider/dashboard`
3. **Back to Dashboard action:** On secondary pages (restaurant listing, orders, account, menu editor, dispatch, routing lab etc.) logged-in users with verified active roles see an ivory/orange fixed `← Back to Dashboard` link at the bottom-left. Clicking resolves the signed-in user's dashboard, not a hard-coded role. Dashboards themselves already feature sidebar Overview links. The landing page has a `My dashboard` link in its header for signed-in users instead of duplicating the fixed action.
4. **Security:** For restaurant/rider/admin, frontend route and return-link visibility require both active Firestore profile and matching Firebase ID-token custom claim. Customer users must have an active customer profile, with no privileged role claim. A pending, suspended, or profile-less account remains on `/account` for review/recovery instead of getting a guessed dashboard. The backend and Firestore rules are unchanged and remain the authorization boundary.

## Apply the overlay

**Back up your project or commit your working changes first.** This patch is built on the prior Phase 6A all-dashboards overlay; apply that release before this one.

Extract this archive into `C:\Users\ANIMESH\Desktop\FOODROUTE` preserving `apps/web/src/...` paths. Only the eleven listed source files are included; no `.env.local`, keys, package manifests, backend files, or Firebase rules are replaced.

If you have edited `App.tsx`, `LoginPage.tsx`, `RequireRole.tsx`, or the navigation files since Phase 6A, compare and merge those changes instead of blindly overwriting them.

PowerShell terminal:

```powershell
cd C:\Users\ANIMESH\Desktop\FOODROUTE\apps\web
npm install
npm run typecheck
npx vitest run src/features/dashboard/dashboard.meta.test.ts
npm run build
npm run dev
```

When the app is running, check:

1. Sign out, then sign in with a customer account at `http://localhost:5173/login`. Expected: `/customer/dashboard`, not `/account`.
2. Sign out and sign in as the approved admin. Expected: `/admin/dashboard`. Open `/admin/dispatch` and look for `← Back to Dashboard` near the lower-left corner. It returns to `/admin/dashboard`.
3. Repeat using an approved active restaurant account: `/restaurant/dashboard` -> `/restaurant/menu` -> return button.
4. Repeat with an active rider: `/rider/dashboard` -> `/rider/deliveries` -> return button.
5. Open `/login` while already signed in. Expected: redirect back to your role dashboard.
6. Open `/account`, `/restaurants`, `/orders`, or `/algorithm-lab` while signed in. Expected: return link (where the page is otherwise accessible).
7. Open a different role's workspace URL. Expected: denied; no privilege escalation.
8. In a narrow/mobile viewport, confirm the return button remains visible and keyboard accessible.

**Note:** Users with missing or suspended profiles may still be directed to `/account` for necessary remediation; this is intentional, not a broken login redirect. Roles approved recently may require logging out/in to refresh a Firebase ID token.

## Validation in package creation environment

- Verified TypeScript parser syntax in 69 TS/TSX source files.
- Verified presence of 205 relative source imports.
- Verified pure navigation helpers: role-to-dashboard mappings, secondary-page return behavior, disabled return for unauthenticated/unverified states and dashboard/sign-in screens.
- ZIP archive integrity verified.
- **The complete Vite build and Firebase live account flow remain untested here** because dependency installation failed in the authoring container; run the PowerShell commands above and send any error output.

## Rollback

Restore the eleven modified/added `apps/web/src/...` files from your Git backup. The patch does not change any Firebase data or server configuration.
