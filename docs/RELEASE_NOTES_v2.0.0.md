# FOODROUTE 2.0 — v2.0.0

**Release date:** 22 October 2026  
**Release type:** Publicly hosted portfolio / academic demonstration  
**Repository:** https://github.com/Animesh-666/FOODROUTE  
**Frontend:** https://foodroute-six.vercel.app/  
**Hosted API health:** https://foodroute-api.onrender.com/api/health

## Overview

FOODROUTE 2.0 moves the project from earlier standalone prototypes into a React/TypeScript and Firebase-based demo, with a Node.js API deployed separately on Render. The project highlights secure role-specific workflows and small-instance delivery-route optimization for Design & Analysis of Algorithms coursework.

## What's included

- **Floating Food design:** responsive home page, restaurant/catalog browsing, cart and clean navigation.
- **Four dashboards:** customer, restaurant, rider and administrator, with role-aware routing and back-to-dashboard navigation.
- **Firebase-backed workflows:** Authentication, Firestore role-scoped subscriptions and a trusted API for authorized mutations.
- **COD checkout:** server-validated menu prices, short-lived quotation receipts, duplicate-request protection and customer order history.
- **Restaurant operations:** published menu/availability editing, pickup and service-area configuration, authorized order progression, COD order-value reports and a privacy-minimized CSV export.
- **Rider and admin dispatch:** availability, offers, status transitions, manual assignment and optimized multi-order previews/commits; transactional validation for eligible orders and assignment freshness.
- **DAA lab:** Greedy nearest neighbor, exact Held–Karp, 2-opt and bounded multi-rider heuristic comparisons with synthetic estimates.
- **Dashboard insights:** role-specific order and delivery summaries, notification/activity views derived from authorized snapshots.
- **Deployment foundation:** Vercel frontend, Dockerized Render API, Firebase Auth/Firestore, release audit, CI, emulator tests and Playwright smoke tests.

## Verification and release constraints

Earlier local development reported passing frontend/backend algorithm tests, Firestore rules regression, and browser smoke checks. **Do not interpret that as a complete audited production E2E test.** Authenticated four-role browser tests were previously skipped without dedicated test accounts. The initial GitHub Actions pipeline reported failed **web** and **routing-engine** jobs because of incorrect npm lockfile cache paths; see the CI patch included with this release kit. Publish the versioned GitHub release **only after the updated main-branch CI is green** and live disposable checkout/role checks have been repeated.

### Hosted smoke checks

1. Open the Vercel homepage and verify public navigation and direct dashboard URL rewrites.
2. Verify `GET https://foodroute-api.onrender.com/api/health` returns `{"ok":true,"mode":"cloudrun"}` using the exact URL without added query parameters.
3. Verify an anonymous `POST /api/quote` returns `401`, while an authenticated disposable customer receives a server-issued `quoteId` with valid pricing.
4. Place one fictional COD test order; verify it appears for the correct customer and restaurant.
5. Exercise role guards, authorized status transitions and simulated test dispatch; verify other roles cannot access the data.
6. Check Vercel's Auth authorized domain, Render's exact allowed origin and all mobile layouts.
7. Check and rotate any credentials ever exposed previously; review Actions/Render/Vercel logs for leaks.

## Known limitations

- **Non-commercial demo:** not certified for real food-service operations, production dispatch, user safety or legal/privacy requirements.
- No online payment processing, proof of COD collection, payouts, taxes or reconciled revenue.
- No real-time GPS tracking, live traffic ETAs, contracted geocoding or production road navigation. Hosted road-demo endpoints intentionally disabled.
- In-app activity notifications are not durable push notifications.
- Public onboarding/approvals, App Check or other abuse defenses, distributed rate limiting, secret rotation, backup/restore, audit trails, retention and broader accessibility/E2E testing need further work.
- Render free-tier spin-down can cause cold starts; production reliability requires an appropriate paid/reliable hosting plan.
- Media assets and any map-provider licensing require independent review before commercial reuse.

## Upgrade and rollback

The demo is a monorepo. Vercel deploys `apps/web` from `main`; Render deploys `services/functions` as a Docker web service. Firebase projects and server-side secrets are **not** bundled in the source. Revert via the hosting provider's previous successful deployment and a reviewed Git commit; do not blindly roll back Firestore state or expose credentials. See `docs/PHASE7_RELEASE_AND_DEPLOYMENT.md` and `SECURITY.md`.

## Thank you

FOODROUTE 2.0 is a practical exploration of frontend development, backend security, Firebase data flows and algorithm trade-offs. Contributions, bug reports and documentation improvements are welcome, but **do not share secrets or sensitive user information in public issues**.
