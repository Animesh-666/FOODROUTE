# FOODROUTE 2.0 — Phase 2 Firebase Authentication Foundation

This overlay upgrades the **approved warm-ivory/orange React homepage** without changing its layout, menu, or demo cart. The new `/login`, `/signup`, `/forgot-password`, and `/account` pages use the same visual identity.

## Included and deliberately not included

- Included: React Router, Firebase Web SDK, customer-only email/password signup/sign-in, email verification request/resend, password reset, customer profile creation/read/update, route protection, rules allowing only owner reads + safe customer profile writes, `.env.example`, optional local emulator settings.
- Not implemented yet: real menu ownership, restaurant/rider/admin onboarding or dashboards, Firebase ordering/cart, payment provider, privileged-role provisioning, server Cloud Functions, route optimizer integration. Demo checkout still **does not** place an order.
- The rules intentionally **deny all other Firestore collections**. They are a phase-specific starting point and must be reviewed when adding backend operations.

## Safe installation into your existing FOODROUTE folder

1. Back up or commit existing work. Extract `FOODROUTE_Phase2_React_Firebase.zip` into a temporary folder first. It contains `apps/web`, `firebase`, `firebase.phase2.example.json`, and `docs`. Inspect file diffs before copying into your active repository; don't overwrite live Firestore rules unknowingly.
2. Overlay **only** `apps/web` into the existing project's `apps/web` (the existing design and assets are included). Copy `firebase/firestore.rules` and indexes after checking your project's existing security rules. **Do not overwrite other backend folders or root Firebase configuration.**
3. In Firebase Console create or select a **development** Firebase project. Register a Web app, create a Firestore database, and enable **Authentication → Sign-in method → Email/Password**.
4. Create `apps/web/.env.local` from `apps/web/.env.example`. Fill Firebase web configuration values. Do not enter service account credentials or any 21st API keys there. Firebase web API keys are public identifiers; protect data using Auth and rules. Restart Vite after `.env.local` changes.
5. Run `cd apps/web`, then `npm install`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run dev`.
6. **Deploy the checked security rules before using real Firestore:** from root install/use Firebase CLI (`npx firebase-tools` or your installed CLI), select the **development project** and run `firebase deploy --only firestore:rules,firestore:indexes --project YOUR_DEV_PROJECT_ID`. The root `firebase.json` from the 2.0 scaffold already references `firebase/firestore.rules` and `firebase/firestore.indexes.json`.
7. Test `/signup` → new customer created in **Authentication** and `users/{uid}` created in **Firestore** → `/account` → update display name → sign out → `/login` → `/account` again → reset password. Verify anonymous users cannot read customer documents or create privileged roles.

### Optional local emulators

- Copy the `emulators` block from `firebase.phase2.example.json` into your root `firebase.json` (do not replace your existing config).
- Run from the repo root: `npx firebase-tools emulators:start --only auth,firestore --project demo-foodroute-local`.
- Use a **separate** `.env.local` for local emulators with `VITE_FIREBASE_PROJECT_ID=demo-foodroute-local`, other required web configuration fields set to local test values, and `VITE_USE_FIREBASE_EMULATORS=true`.
- Emulator usage is gated behind `import.meta.env.DEV` and is never enabled on a production build.

### Deployment note

For React Router deep links, configure Firebase Hosting with `"rewrites": [{"source":"**","destination":"/index.html"}]` and `"public":"apps/web/dist"`. The supplied `firebase.phase2.example.json` illustrates it. **Do not deploy hosting until you choose the Firebase project and review the root `firebase.json`.**

### Account and security safeguards

- Signup **always** creates customer role. Do not add a role selector to public signup.
- Firestore rules restrict profile creation to the authenticated user's own ID, immutable customer role, verified email equality, bounded display name, and server-managed timestamps. Client updates may only change display name / updated timestamp. Account suspension and role changes must be enforced by trusted backend services later, not by UI only.
- The `users` collection is protected by owner-only reads. Other application collections are currently denied.
- Login does not authorize privileged actions. Role-specific secure routes and custom claims will be added in a later phase together with backend enforcement.
- New Firebase Auth account may exist if profile write fails. `/account` provides a recovery action to finish creating its customer profile; do not manually assign admin roles.
- If the page shows "Firebase is not configured yet," double-check `.env.local` spelling and restart the dev server.
- If you see `permission-denied`, check Firestore rule deployment, Firebase project IDs, and Auth login. Never loosen rules to `allow read, write: if true` to fix connectivity.

### Acceptance checks before merging

- [ ] Homepage identical or visually equivalent to approved screenshot; menu/cart/order preview unchanged.
- [ ] No sensitive credentials in Git, browser bundle, or uploaded support ZIP.
- [ ] Missing Firebase config does not break anonymous browsing, but disables account forms with a clear message.
- [ ] New public signup creates `role=customer` and profile owner-only read.
- [ ] Profile name edit works, but no client can change `role` or `status`.
- [ ] Signing out blocks `/account` and redirects to `/login`.
- [ ] Unknown routes and refresh behavior work using configured Hosting rewrite.
- [ ] `/account` displays a clear recovery path if profile creation failed.

**Next phase after acceptance:** restaurant-owned menu and customer cart + server-priced quote/checkout, supported by Cloud Functions and stricter per-document access rules. Do not mark demo checkout as production ordering until the backend exists.
