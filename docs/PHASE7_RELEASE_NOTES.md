# FOODROUTE 2.0 — v2.0.0-rc.1 draft release notes

**Release candidate, not launched.** To be tagged only after isolated-staging integration tests and review.

## Included
- Phase 1–6B interfaces preserved: animated landing, role-based dashboards, ordering, rider flow, secure optimized dispatch in local development, insights and in-app notifications.
- Phase 7: HTTPS-only Cloud Run client transport, hosted API candidate, stable signing-key support, SPA Hosting example, GitHub Actions quality gates, release source audit, read-only HTTP smoke, optional Playwright smoke and deployment runbook.

## Known limitations
- No proof of production deployment or four-role live end-to-end pass in this package.
- Only COD recorded; revenue not reconciled; no online payment collection.
- No independently verified road ETA, traffic optimization or rider GPS. Public demo routing/search is disabled from hosted API.
- Admin callable approvals and rider onboarding still need production-grade separate deployment/tests.
- No Firebase App Check or distributed rate limiting; security, accessibility, mobile browser and operational rollback require independent validation.
- In-app notifications are not push notifications and do not persist across sessions.

## Release criteria
GitHub CI green; separate staging Firestore project; 4 roles, 2-rider 3-order simulation, parallel assignment conflict test, security review, hosted API privacy policy, budget approval/quotas, monitored pilot, rollback rehearsal. Do not mark `v2.0.0` final before these.
