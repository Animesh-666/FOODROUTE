# FOODROUTE 2.0 — Phase 7 Release Candidate

Phase 7 adds CI, release security checks, an HTTPS-only Cloud Run API candidate, Firebase Hosting configuration, browser navigation smoke tests, and deployment documentation. The approved Floating Food landing page, existing dashboards, Firebase security rules, and localhost development server are preserved.

**Status:** Source implemented; **NOT LIVE / NOT PRODUCTION-VERIFIED.** Real deployment requires an approved cloud billing plan and many security/E2E checks.

Start with `docs/PHASE7_RELEASE_AND_DEPLOYMENT.md`.

## What changed

- New hosted server `services/functions/src/orders/prod-server.ts` and container recipe `services/functions/Dockerfile`; local server remains at `127.0.0.1:8787`.
- New Vite `cloudrun` API mode (`apps/web/src/lib/trusted-api.ts`); existing `local` and callable-order `functions` modes remain.
- Signed route previews use a stable managed secret in production (still ephemeral in local development).
- Firebase Hosting SPA example `firebase.phase7.example.json` — deliberately does **not** replace the user's existing `firebase.json`.
- CI quality gates, Firestore Emulator regression, release audit, read-only API smoke test, optional Playwright desktop/mobile role navigation suite.
- No Firebase data/rules writes, credential files, homepage redesign, or automatic deployments in this overlay.

## Local quick checks (from repository root)

```powershell
node scripts/phase7-audit.cjs
node --test tests/phase7-release.test.cjs
cd apps\web
npm ci
npm run test:ci
cd ..\..\services\functions
npm ci
npm run typecheck
npm run test:release
```

## Architecture (target)

`React/Vite on Firebase Hosting → HTTPS Cloud Run API → Firebase Admin SDK → Firestore/Auth`

`Customer/restaurant/rider/admin dashboard → Firestore role-scoped subscriptions`

`Firebase Auth ID token → protected server actions → order/rider transaction checks`

Production road demo calls and external address search are intentionally disabled. Before launch, implement abuse controls/App Check, secure approval flows and verify all order/rider paths.
